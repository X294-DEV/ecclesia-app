import {
  EventType,
  PaymentMethod,
  PrismaClient,
  Role,
  type Event as EventRow,
  type Ministry,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = process.env.SEED_PASSWORD ?? "Ecclesia2026!";

/** Fecha relativa a hoy (offset en días, hora local). */
function daysFromNow(offset: number, hour = 0): Date {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

async function seedUsers() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const users: { name: string; email: string; role: Role }[] = [
    { name: "Administrador General", email: "admin@ecclesia.test", role: Role.ADMIN },
    { name: "Pastor Samuel Reyes", email: "pastor@ecclesia.test", role: Role.PASTOR },
    { name: "Secretaria Laura Gómez", email: "secretario@ecclesia.test", role: Role.SECRETARIO },
    { name: "Tesorero Andrés Mora", email: "tesorero@ecclesia.test", role: Role.TESORERO },
    { name: "Coordinadora Ruth Salas", email: "coordinador@ecclesia.test", role: Role.COORDINADOR },
  ];

  const created: Record<string, string> = {};
  for (const user of users) {
    const row = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, passwordHash },
    });
    created[user.role] = row.id;
  }
  return created;
}

async function seedChurch() {
  await prisma.church.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Iglesia Esperanza Viva",
      address: "Av. Principal 123, Col. Centro",
      phone: "55 5555 0100",
      email: "contacto@esperanzaviva.example",
    },
  });

  if ((await prisma.meetingSchedule.count()) === 0) {
    await prisma.meetingSchedule.createMany({
      data: [
        { dayOfWeek: 0, time: "10:00", description: "Culto dominical" },
        { dayOfWeek: 3, time: "19:00", description: "Estudio bíblico" },
        { dayOfWeek: 6, time: "18:00", description: "Reunión de jóvenes" },
      ],
    });
  }
}

async function seedDemoData(userIds: Record<string, string>) {
  if ((await prisma.member.count()) > 0) {
    console.log("Ya hay miembros registrados: se omiten los datos de demostración.");
    return;
  }

  const names = [
    "Ana Sofía Ramírez",
    "Carlos Hernández",
    "María Guadalupe López",
    "José Luis Martínez",
    "Lucía Fernández",
    "Miguel Ángel Torres",
    "Patricia Morales",
    "Ricardo Vega",
    "Elena Castillo",
    "Daniel Ortiz",
    "Sandra Rivas",
    "Héctor Ruiz",
  ];

  await prisma.member.createMany({
    data: names.map((name, index) => ({
      name,
      phone: `55 1000 ${String(index + 1).padStart(4, "0")}`,
      email: `miembro${String(index + 1).padStart(2, "0")}@example.com`,
      joinDate: new Date(2019 + (index % 6), index % 12, 5 + index),
      active: index !== names.length - 1, // el último queda inactivo para probar el filtro
    })),
  });
  const members = await prisma.member.findMany({ orderBy: { name: "asc" } });

  // Ministerios, coordinadores e integrantes
  const ministryDefs = [
    { name: "Alabanza y música", description: "Equipo de música y adoración" },
    { name: "Jóvenes", description: "Reuniones y actividades para jóvenes" },
    { name: "Niños", description: "Escuela dominical y actividades infantiles" },
    { name: "Enseñanza", description: "Estudios bíblicos y discipulado" },
    { name: "Servicio", description: "Logística, bienvenida y apoyo comunitario" },
  ];
  const ministries: Ministry[] = [];
  for (const [index, def] of ministryDefs.entries()) {
    ministries.push(
      await prisma.ministry.create({ data: { ...def, coordinatorId: members[index].id } }),
    );
  }
  // La coordinadora de demostración queda vinculada al coordinador de "Jóvenes"
  // para que el alcance por ministerio (src/server/scope.ts) tenga datos.
  await prisma.user.update({
    where: { id: userIds[Role.COORDINADOR] },
    data: { memberId: ministries[1].coordinatorId },
  });

  await prisma.ministryMember.createMany({
    data: members
      .filter((member) => member.active)
      .flatMap((member, index) => [
        { ministryId: ministries[index % ministries.length].id, memberId: member.id },
        { ministryId: ministries[(index + 2) % ministries.length].id, memberId: member.id },
      ]),
    skipDuplicates: true,
  });

  // Eventos (uno pasado para tener asistencia, el resto próximos)
  const worship = ministries[0];
  const youth = ministries[1];
  const eventDefs = [
    { title: "Culto dominical", offset: -4, time: "10:00", type: EventType.RELIGIOSO, location: "Templo principal", ministryId: undefined },
    { title: "Ensayo de alabanza", offset: 1, time: "19:00", type: EventType.RELIGIOSO, location: "Salón de música", ministryId: worship.id },
    { title: "Culto dominical", offset: 3, time: "10:00", type: EventType.RELIGIOSO, location: "Templo principal", ministryId: undefined },
    { title: "Reunión de jóvenes", offset: 5, time: "18:00", type: EventType.RELIGIOSO, location: "Salón de jóvenes", ministryId: youth.id },
    { title: "Junta administrativa", offset: 8, time: "17:00", type: EventType.ADMINISTRATIVO, location: "Oficina pastoral", ministryId: undefined },
  ];
  const events: EventRow[] = [];
  for (const def of eventDefs) {
    events.push(
      await prisma.event.create({
        data: {
          title: def.title,
          date: daysFromNow(def.offset),
          time: def.time,
          location: def.location,
          description: `${def.title} (dato de demostración)`,
          type: def.type,
          responsibleId: members[0].id,
          ministryId: def.ministryId,
        },
      }),
    );
  }

  // Asistencia del culto pasado
  await prisma.attendance.createMany({
    data: members
      .filter((member) => member.active)
      .map((member, index) => ({
        eventId: events[0].id,
        memberId: member.id,
        present: index % 4 !== 0,
      })),
  });

  // Donaciones (algunas anónimas: memberId nulo)
  const donationDefs: [number, string, string, PaymentMethod, number | null][] = [
    [-2, "850.00", "Diezmo", PaymentMethod.EFECTIVO, 0],
    [-2, "300.00", "Ofrenda dominical", PaymentMethod.EFECTIVO, null],
    [-5, "1200.00", "Diezmo", PaymentMethod.TRANSFERENCIA, 1],
    [-9, "500.00", "Ofrenda para misiones", PaymentMethod.TRANSFERENCIA, 2],
    [-12, "250.00", "Ofrenda dominical", PaymentMethod.EFECTIVO, null],
    [-16, "2000.00", "Donativo para construcción", PaymentMethod.TRANSFERENCIA, 3],
    [-20, "700.00", "Diezmo", PaymentMethod.TARJETA, 4],
    [-27, "320.00", "Ofrenda dominical", PaymentMethod.EFECTIVO, null],
    [-33, "900.00", "Diezmo", PaymentMethod.TRANSFERENCIA, 5],
    [-41, "450.00", "Ofrenda especial", PaymentMethod.EFECTIVO, null],
    [-48, "1500.00", "Diezmo", PaymentMethod.TRANSFERENCIA, 6],
    [-55, "380.00", "Ofrenda dominical", PaymentMethod.EFECTIVO, null],
  ];
  await prisma.donation.createMany({
    data: donationDefs.map(([offset, amount, concept, method, memberIndex]) => ({
      date: daysFromNow(offset),
      amount,
      concept,
      method,
      memberId: memberIndex === null ? null : members[memberIndex].id,
      createdById: userIds[Role.TESORERO],
    })),
  });

  // Anuncios
  await prisma.announcement.createMany({
    data: [
      {
        title: "Bienvenidos a Ecclesia",
        content: "Este es un anuncio de demostración. Aquí se publican los avisos para la congregación.",
        important: false,
        publishedAt: daysFromNow(-3),
        authorId: userIds[Role.SECRETARIO],
      },
      {
        title: "Cambio de horario del culto del domingo",
        content: "Por mantenimiento del templo, el culto iniciará a las 11:00 este domingo.",
        important: true,
        publishedAt: daysFromNow(-1),
        authorId: userIds[Role.PASTOR],
      },
      {
        title: "Colecta de víveres",
        content: "Estamos juntando víveres no perecederos para familias de la comunidad. Entrega en recepción.",
        important: false,
        publishedAt: daysFromNow(0),
        authorId: userIds[Role.ADMIN],
      },
    ],
  });
}

async function main() {
  const userIds = await seedUsers();
  await seedChurch();
  await seedDemoData(userIds);

  console.log("\nSeed listo. Usuarios de demostración (contraseña: %s):", PASSWORD);
  console.log("  admin@ecclesia.test        -> ADMIN");
  console.log("  pastor@ecclesia.test       -> PASTOR");
  console.log("  secretario@ecclesia.test   -> SECRETARIO");
  console.log("  tesorero@ecclesia.test     -> TESORERO");
  console.log("  coordinador@ecclesia.test  -> COORDINADOR\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

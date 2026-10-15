import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting DBU Connect synthetic seed generation...');

  // 1. Clean previous seeded records
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.savedListing.deleteMany();
  await prisma.marketplaceListing.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.friendRequest.deleteMany();
  await prisma.report.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.studentRoster.deleteMany();

  const defaultPasswordHash = await bcrypt.hash('DBUConnect2026!', 10);

  // 2. Seed Official University Student Roster Records
  console.log('📋 Seeding Registrar official student roster records...');
  const rosterA = await prisma.studentRoster.create({
    data: {
      studentId: 'DBU/14/0892',
      universityEmail: 'abebe.kebede@dbu.edu.et',
      fullName: 'Abebe Kebede',
      department: 'Computer Science',
      faculty: 'Computing and Informatics',
      admissionYear: 2022,
      eligibilityStatus: 'ELIGIBLE',
      claimed: true,
    },
  });

  const rosterB = await prisma.studentRoster.create({
    data: {
      studentId: 'DBU/14/1044',
      universityEmail: 'bethlehem.haile@dbu.edu.et',
      fullName: 'Bethlehem Haile',
      department: 'Software Engineering',
      faculty: 'Computing and Informatics',
      admissionYear: 2022,
      eligibilityStatus: 'ELIGIBLE',
      claimed: true,
    },
  });

  const rosterC = await prisma.studentRoster.create({
    data: {
      studentId: 'DBU/15/0512',
      universityEmail: 'yared.getachew@dbu.edu.et',
      fullName: 'Yared Getachew',
      department: 'Electrical & Computer Engineering',
      faculty: 'Technology and Engineering',
      admissionYear: 2023,
      eligibilityStatus: 'ELIGIBLE',
      claimed: true,
    },
  });

  // Additional unclaimed roster records for live onboarding demonstration!
  await prisma.studentRoster.createMany({
    data: [
      {
        studentId: 'DBU/15/0781',
        universityEmail: 'kalkidan.alemu@dbu.edu.et',
        fullName: 'Kalkidan Alemu',
        department: 'Information Systems',
        faculty: 'Computing and Informatics',
        admissionYear: 2023,
        eligibilityStatus: 'ELIGIBLE',
        claimed: false,
      },
      {
        studentId: 'DBU/16/0204',
        universityEmail: 'natnael.tesfaye@dbu.edu.et',
        fullName: 'Natnael Tesfaye',
        department: 'Mechanical Engineering',
        faculty: 'Technology and Engineering',
        admissionYear: 2024,
        eligibilityStatus: 'ELIGIBLE',
        claimed: false,
      },
      {
        studentId: 'DBU/16/0339',
        universityEmail: 'selamawit.bekele@dbu.edu.et',
        fullName: 'Selamawit Bekele',
        department: 'Civil Engineering',
        faculty: 'Technology and Engineering',
        admissionYear: 2024,
        eligibilityStatus: 'PENDING_REVIEW', // For testing eligibility warning
        claimed: false,
      },
    ],
  });

  // 3. Create Demonstration User Accounts
  console.log('👤 Creating demonstration accounts for all system roles...');
  // Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@dbu.edu.et',
      passwordHash: defaultPasswordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: 'Dr. Girma Worku (Super Admin)',
          bio: 'Debre Berhan University Platform & Systems Administrator.',
          department: 'ICT Directorate',
          privacyLevel: 'PUBLIC',
        },
      },
    },
  });

  // Registrar
  const registrar = await prisma.user.create({
    data: {
      email: 'registrar@dbu.edu.et',
      passwordHash: defaultPasswordHash,
      role: 'REGISTRAR',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: 'Almaz Tessema (Registrar)',
          bio: 'Head of Student Admissions & Records Management.',
          department: 'Office of the University Registrar',
          privacyLevel: 'CAMPUS_ONLY',
        },
      },
    },
  });

  // Admin / Moderator
  const admin = await prisma.user.create({
    data: {
      email: 'admin@dbu.edu.et',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: 'Mulugeta Assefa (Admin)',
          bio: 'Student Affairs Moderator and Campus Community Coordinator.',
          department: 'Dean of Students Directorate',
          privacyLevel: 'CAMPUS_ONLY',
        },
      },
    },
  });

  // Student A (Abebe)
  const studentA = await prisma.user.create({
    data: {
      email: 'abebe.kebede@dbu.edu.et',
      passwordHash: defaultPasswordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: 'Abebe Kebede',
          bio: 'Passionate about coding, AI and building useful solutions for real problems.',
          department: 'Software Engineering',
          graduationYear: 2026,
          avatarUrl: '/images/avatars/abebe.svg',
          privacyLevel: 'CAMPUS_ONLY',
        },
      },
    },
  });
  await prisma.studentRoster.update({
    where: { id: rosterA.id },
    data: { claimedByUserId: studentA.id },
  });

  // Student B (Bethlehem)
  const studentB = await prisma.user.create({
    data: {
      email: 'bethlehem.haile@dbu.edu.et',
      passwordHash: defaultPasswordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: 'Bethlehem Haile',
          bio: '3rd year Software Engineering student. President of the DBU Women in Technology Club.',
          department: 'Software Engineering',
          graduationYear: 2026,
          avatarUrl: '/images/avatars/bethlehem.svg',
          privacyLevel: 'CAMPUS_ONLY',
        },
      },
    },
  });
  await prisma.studentRoster.update({
    where: { id: rosterB.id },
    data: { claimedByUserId: studentB.id },
  });

  // Student C (Yared)
  const studentC = await prisma.user.create({
    data: {
      email: 'yared.getachew@dbu.edu.et',
      passwordHash: defaultPasswordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: 'Yared Getachew',
          bio: 'ECE Student interested in embedded robotics and campus electronics repair.',
          department: 'Electrical & Computer Engineering',
          graduationYear: 2027,
          avatarUrl: '/images/avatars/yared.svg',
          privacyLevel: 'CAMPUS_ONLY',
        },
      },
    },
  });
  await prisma.studentRoster.update({
    where: { id: rosterC.id },
    data: { claimedByUserId: studentC.id },
  });

  // Additional campus students from reference design
  const studentMeaza = await prisma.user.create({
    data: {
      email: 'meaza.tesfaye@dbu.edu.et',
      passwordHash: defaultPasswordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: 'Meaza Tesfaye',
          bio: "Tech enthusiast | Learner | Dreamer. Let's connect! 💙",
          department: 'Computer Science',
          graduationYear: 2026,
          avatarUrl: '/images/avatars/meaza.svg',
          privacyLevel: 'CAMPUS_ONLY',
        },
      },
    },
  });

  const studentDaniel = await prisma.user.create({
    data: {
      email: 'daniel.girma@dbu.edu.et',
      passwordHash: defaultPasswordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: 'Daniel Girma',
          bio: 'Building better systems one line of code at a time.',
          department: 'Software Engineering',
          graduationYear: 2026,
          avatarUrl: '/images/avatars/daniel.svg',
          privacyLevel: 'CAMPUS_ONLY',
        },
      },
    },
  });

  const studentLidya = await prisma.user.create({
    data: {
      email: 'lidya.alemu@dbu.edu.et',
      passwordHash: defaultPasswordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: 'Lidya Alemu',
          bio: 'Code • Learn • Create something great!',
          department: 'Information Systems',
          graduationYear: 2025,
          avatarUrl: '/images/avatars/lidya.svg',
          privacyLevel: 'CAMPUS_ONLY',
        },
      },
    },
  });

  const studentYonatan = await prisma.user.create({
    data: {
      email: 'yonatan.tsegaye@dbu.edu.et',
      passwordHash: defaultPasswordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: 'Yonatan Tsegaye',
          bio: 'Always curious about new technologies and ideas.',
          department: 'Software Engineering',
          graduationYear: 2027,
          avatarUrl: '/images/avatars/yonatan.svg',
          privacyLevel: 'CAMPUS_ONLY',
        },
      },
    },
  });

  const studentSelamawit = await prisma.user.create({
    data: {
      email: 'selamawit.wondimu@dbu.edu.et',
      passwordHash: defaultPasswordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: 'Selamawit Wondimu',
          bio: 'Learning, collaborating, and making an impact.',
          department: 'Computer Science',
          graduationYear: 2026,
          avatarUrl: '/images/avatars/selamawit.svg',
          privacyLevel: 'CAMPUS_ONLY',
        },
      },
    },
  });

  const studentHaile = await prisma.user.create({
    data: {
      email: 'haile.demisse@dbu.edu.et',
      passwordHash: defaultPasswordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: 'Haile Demisse',
          bio: 'Turning ideas into real-world solutions. 🚀',
          department: 'Software Engineering',
          graduationYear: 2026,
          avatarUrl: '/images/avatars/haile.svg',
          privacyLevel: 'CAMPUS_ONLY',
        },
      },
    },
  });

  const studentRuth = await prisma.user.create({
    data: {
      email: 'ruth.abebe@dbu.edu.et',
      passwordHash: defaultPasswordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: 'Ruth Abebe',
          bio: 'Technology for a better and brighter future.',
          department: 'Information Systems',
          graduationYear: 2025,
          avatarUrl: '/images/avatars/ruth.svg',
          privacyLevel: 'CAMPUS_ONLY',
        },
      },
    },
  });

  const studentFitsum = await prisma.user.create({
    data: {
      email: 'fitsum.arega@dbu.edu.et',
      passwordHash: defaultPasswordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: 'Fitsum Arega',
          bio: 'Civil engineering student, passionate about sustainable campus infrastructure.',
          department: 'Civil Engineering',
          graduationYear: 2025,
          avatarUrl: '/images/avatars/fitsum.svg',
          privacyLevel: 'CAMPUS_ONLY',
        },
      },
    },
  });

  const studentKindu = await prisma.user.create({
    data: {
      email: 'kindu.shiferaw@dbu.edu.et',
      passwordHash: defaultPasswordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: 'Kindu Shiferaw',
          bio: 'Hardware hacker, embedded robotics, and circuit design.',
          department: 'Electrical & Computer Engineering',
          graduationYear: 2026,
          avatarUrl: '/images/avatars/kindu.svg',
          privacyLevel: 'CAMPUS_ONLY',
        },
      },
    },
  });

  const studentMarta = await prisma.user.create({
    data: {
      email: 'marta.bekele@dbu.edu.et',
      passwordHash: defaultPasswordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: 'Marta Bekele',
          bio: 'Healthcare advocate, medical student research, and community wellness.',
          department: 'Public Health',
          graduationYear: 2025,
          avatarUrl: '/images/avatars/marta.svg',
          privacyLevel: 'CAMPUS_ONLY',
        },
      },
    },
  });

  const studentYonas = await prisma.user.create({
    data: {
      email: 'yonas.alemu@dbu.edu.et',
      passwordHash: defaultPasswordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: 'Yonas Alemu',
          bio: 'Data analytics, econometrics, and campus economics club coordinator.',
          department: 'Economics',
          graduationYear: 2026,
          avatarUrl: '/images/avatars/yonas.svg',
          privacyLevel: 'CAMPUS_ONLY',
        },
      },
    },
  });

  // 4. Friendships and Connections
  console.log('🤝 Establishing canonical friendships and sample requests...');
  const [uA, uB] = studentA.id < studentB.id ? [studentA.id, studentB.id] : [studentB.id, studentA.id];
  await prisma.friendship.create({
    data: { user1Id: uA, user2Id: uB },
  });

  // Outgoing pending friend request from studentA to Meaza
  await prisma.friendRequest.create({
    data: {
      senderId: studentA.id,
      receiverId: studentMeaza.id,
      status: 'PENDING',
    },
  });

  // Outgoing pending friend request from studentA to Haile
  await prisma.friendRequest.create({
    data: {
      senderId: studentA.id,
      receiverId: studentHaile.id,
      status: 'PENDING',
    },
  });

  // Incoming pending friend request from Lidya to studentA (allows testing Accept/Reject)
  await prisma.friendRequest.create({
    data: {
      senderId: studentLidya.id,
      receiverId: studentA.id,
      status: 'PENDING',
    },
  });

  // 5. Social Feed Posts, Comments, and Likes
  console.log('💬 Publishing realistic campus posts and discussions...');
  const post1 = await prisma.post.create({
    data: {
      authorId: studentA.id,
      content:
        '🎉 Excited to announce that our Computer Science Senior Capstone showcase is happening this Friday at the Informatics Auditorium! Come check out projects on IoT farming, campus social networks, and healthcare analytics.',
      visibility: 'CAMPUS',
      status: 'ACTIVE',
      shareCount: 4,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      authorId: studentB.id,
      content:
        '📢 DBU Women in Tech Club is hosting a free hands-on Python and Web Development workshop this Saturday at 2:00 PM in Lab 3. Beginners are warmly welcome! Bring your laptops.',
      visibility: 'CAMPUS',
      status: 'ACTIVE',
      shareCount: 9,
    },
  });

  const post3 = await prisma.post.create({
    data: {
      authorId: studentC.id,
      content:
        '💡 Quick reminder for 2nd and 3rd year engineering students: Midterm examination room assignments have been posted on the bulletin board outside Block 5. Good luck with study week!',
      visibility: 'CAMPUS',
      status: 'ACTIVE',
      shareCount: 2,
    },
  });

  const post4 = await prisma.post.create({
    data: {
      authorId: admin.id,
      content:
        '🏛️ Official Announcement: The main university library will remain open 24 hours during final examination weeks starting next Monday. Silent study halls are located on the 2nd and 3rd floors.',
      visibility: 'CAMPUS',
      status: 'ACTIVE',
      shareCount: 23,
    },
  });

  // Likes
  await prisma.like.createMany({
    data: [
      { postId: post1.id, userId: studentB.id },
      { postId: post1.id, userId: studentC.id },
      { postId: post2.id, userId: studentA.id },
      { postId: post2.id, userId: studentC.id },
      { postId: post4.id, userId: studentA.id },
      { postId: post4.id, userId: studentB.id },
    ],
  });

  // Comments
  await prisma.comment.createMany({
    data: [
      {
        postId: post1.id,
        authorId: studentB.id,
        content: 'Awesome work Abebe! Looking forward to seeing the live demo.',
      },
      {
        postId: post1.id,
        authorId: studentC.id,
        content: 'Is there a presentation schedule available?',
      },
      {
        postId: post2.id,
        authorId: studentA.id,
        content: 'Great initiative Bethlehem! I will share this with our class group.',
      },
    ],
  });

  // 6. Direct Messaging Conversations
  console.log('✉️ Setting up direct conversations between demonstration students...');
  const directConv = await prisma.conversation.create({
    data: { type: 'DIRECT' },
  });

  await prisma.conversationMember.createMany({
    data: [
      { conversationId: directConv.id, userId: studentA.id },
      { conversationId: directConv.id, userId: studentB.id },
    ],
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: directConv.id,
        senderId: studentB.id,
        content: 'Hey Abebe! Are we meeting at the Informatics library after class for project review?',
      },
      {
        conversationId: directConv.id,
        senderId: studentA.id,
        content: 'Yes! Let us meet at 4:30 PM. I have finalized the API endpoints and test suite for DBU Connect.',
      },
      {
        conversationId: directConv.id,
        senderId: studentB.id,
        content: 'Perfect, I will bring the UI presentation slides.',
      },
    ],
  });

  // 7. Campus Marketplace Listings
  console.log('🛍️ Populating campus marketplace with student listings...');
  await prisma.marketplaceListing.createMany({
    data: [
      {
        sellerId: studentA.id,
        title: 'Algorithms and Data Structures (Cormen - 4th Ed.)',
        description: 'Hardcover textbook in like-new condition. Very helpful for CS and SE year 2-3 data structures courses.',
        category: 'Textbooks',
        price: 450,
        currency: 'ETB',
        condition: 'Like New',
        location: 'Main Campus, Dorm Block 8',
        status: 'ACTIVE',
      },
      {
        sellerId: studentB.id,
        title: 'HP Laptop Charger (65W Blue Pin Original)',
        description: 'Original HP smart AC power adapter. Works with Pavilion, Envy, and ProBook models.',
        category: 'Electronics',
        price: 550,
        currency: 'ETB',
        condition: 'Good',
        location: 'Informatics Department, Room 204',
        status: 'ACTIVE',
      },
      {
        sellerId: studentC.id,
        title: 'Adjustable LED Dorm Desk Study Lamp',
        description: 'Rechargeable USB desk lamp with 3 color temperatures and touch dimmer. Battery lasts 6 hours without power.',
        category: 'Dorm Gear',
        price: 320,
        currency: 'ETB',
        condition: 'Brand New',
        location: 'Engineering Block 12',
        status: 'ACTIVE',
      },
      {
        sellerId: studentA.id,
        title: 'Casio fx-991EX ClassWiz Scientific Calculator',
        description: 'Original scientific calculator with spreadsheet and matrix functions. Essential for calculus and physics.',
        category: 'Electronics',
        price: 800,
        currency: 'ETB',
        condition: 'Like New',
        location: 'Main Campus Library',
        status: 'ACTIVE',
      },
      {
        sellerId: studentC.id,
        title: 'Peer Tutoring: Discrete Mathematics & Digital Logic',
        description: 'Offering weekend 1-on-1 tutoring sessions for first and second year engineering students.',
        category: 'Services',
        price: 150,
        currency: 'ETB',
        condition: 'Brand New',
        location: 'Campus Study Center',
        status: 'ACTIVE',
      },
    ],
  });

  // 8. Sample Moderation Report and Audit Logs
  console.log('🛡️ Creating sample moderation report and administrative audit logs...');
  await prisma.report.create({
    data: {
      reporterId: studentB.id,
      targetType: 'POST',
      targetId: post3.id,
      reason: 'OTHER',
      details: 'Please verify if the exam room for section 2 changed to Block 3.',
      status: 'PENDING',
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorId: superAdmin.id,
        action: 'SYSTEM_INITIALIZATION',
        targetType: 'PLATFORM',
        details: JSON.stringify({ version: '1.0.0', environment: 'production-ready' }),
      },
      {
        actorId: registrar.id,
        action: 'ROSTER_BATCH_IMPORT',
        targetType: 'STUDENT_ROSTER',
        details: JSON.stringify({ batchId: 'BATCH-INITIAL-01', totalRecords: 6 }),
      },
    ],
  });

  console.log('✅ DBU Connect synthetic seed successfully generated!');
  console.log('\n--- Demonstration Credentials ---');
  console.log('Super Admin: superadmin@dbu.edu.et     / DBUConnect2026!');
  console.log('Registrar:   registrar@dbu.edu.et      / DBUConnect2026!');
  console.log('Admin:       admin@dbu.edu.et          / DBUConnect2026!');
  console.log('Student A:   abebe.kebede@dbu.edu.et   / DBUConnect2026!');
  console.log('Student B:   bethlehem.haile@dbu.edu.et/ DBUConnect2026!');
  console.log('Student C:   yared.getachew@dbu.edu.et / DBUConnect2026!');
  console.log('Eligible Unclaimed (Demo): kalkidan.alemu@dbu.edu.et (ID: DBU/15/0781)');
}

main()
  .catch((e) => {
    console.error('Seed script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

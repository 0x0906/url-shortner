const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  await prisma.visit.deleteMany();
  await prisma.url.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const user = await prisma.user.create({
    data: {
      name: 'Demo User',
      email: 'demo@example.com',
      password_hash: passwordHash,
      is_verified: true
    }
  });

  console.log('Seed: Created User -> demo@example.com / password123');

  const urlsData = [
    {
      original_url: 'https://google.com',
      short_code: 'google',
      custom_alias: 'google',
      click_count: 15,
      is_active: true,
      user_id: user.id
    },
    {
      original_url: 'https://github.com',
      short_code: 'github',
      custom_alias: 'github',
      click_count: 8,
      is_active: true,
      user_id: user.id
    },
    {
      original_url: 'https://tailwindcss.com',
      short_code: 'twcss',
      custom_alias: 'twcss',
      click_count: 5,
      is_active: true,
      user_id: user.id
    },
    {
      original_url: 'https://react.dev',
      short_code: 'react',
      custom_alias: 'react',
      click_count: 0,
      is_active: false,
      user_id: user.id
    }
  ];

  const createdUrls = [];
  for (const urlInfo of urlsData) {
    const u = await prisma.url.create({
      data: urlInfo
    });
    createdUrls.push(u);
    console.log(`Seed: Created URL -> ${u.short_code} | ${u.original_url}`);
  }

  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  ];

  const ips = ['1.1.1.1', '8.8.8.8', '127.0.0.1'];

  const googleUrl = createdUrls[0];
  for (let i = 0; i < 15; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 15));
    await prisma.visit.create({
      data: {
        url_id: googleUrl.id,
        ip_address: ips[i % ips.length],
        user_agent: userAgents[i % userAgents.length],
        visited_at: date
      }
    });
  }

  const githubUrl = createdUrls[1];
  for (let i = 0; i < 8; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 15));
    await prisma.visit.create({
      data: {
        url_id: githubUrl.id,
        ip_address: ips[i % ips.length],
        user_agent: userAgents[i % userAgents.length],
        visited_at: date
      }
    });
  }

  const twcssUrl = createdUrls[2];
  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 15));
    await prisma.visit.create({
      data: {
        url_id: twcssUrl.id,
        ip_address: ips[i % ips.length],
        user_agent: userAgents[i % userAgents.length],
        visited_at: date
      }
    });
  }

  console.log('Seed: Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

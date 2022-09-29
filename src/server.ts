import { PrismaClient } from "@prisma/client";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import env from "dotenv";

env.config();
const JWT_SECRET = process.env.JWT_SECRET!;

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

const port = 3005;

function generateToken(id: number) {
  const token = jwt.sign({ id }, JWT_SECRET, { expiresIn: "1h" });
  return token;
}

function verifyToken(token: string) {
  const decoded = jwt.verify(token, JWT_SECRET);
  // @ts-ignore
  return decoded.id;
}

async function getCurrentUser(token: string) {
  const decoded = verifyToken(token);

  const user = await prisma.user.findUnique({
    where: { id: decoded },
  });

  return user;
}

//This endpoint will sign up the user
app.post("/sign-up", async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    } else {
      const hashedPassword = bcrypt.hashSync(password);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
        },
      });

      res.send(user), generateToken(user.id);
    }
  } catch (error) {
    // @ts-ignore
    res.status(500).send({ error: error.message });
  }
});

//This endpoint will sign in the user
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).send({ error: "Invalid credentials." });
    }

    const valid = bcrypt.compareSync(password, user.password);

    if (!valid) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    const token = generateToken(user.id);

    res.send({ user, token });
  } catch (error) {
    // @ts-ignore
    res.status(500).send({ error: error.message });
  }
});

//This endpoint will get/validate the current user
app.get("/validate", async (req, res) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(400).send({ error: "You are not signed in!" });
    } else {
      const user = await getCurrentUser(token);
      if (user) {
        res.send({ user, token: generateToken(user.id) });
      } else {
        res.status(400).send({ error: "Please try to sign in again!" });
      }
    }
  } catch (error) {
    // @ts-ignore
    res.status(500).send({ error: error.message });
  }
});

//This endpoint will get all jobs which contain the search term as a job title
app.get("/jobs/:jobTitle", async (req, res) => {
  try {
    const { jobTitle } = req.params;

    const jobs = await prisma.job.findMany({
      where: { title: { contains: jobTitle } },
      include: { company: true, details: true },
    });

    res.send(jobs);
  } catch (error) {
    // @ts-ignore
    res.status(500).send({ error: error.message });
  }
});

//This endpoint will get all jobs which contain the search term as a job location
app.get("/jobs/:jobLocation", async (req, res) => {
  try {
    const { jobLocation } = req.params;

    const jobs = await prisma.job.findMany({
      where: { location: { contains: jobLocation } },
      include: { company: true, details: true },
    });

    res.send(jobs);
  } catch (error) {
    // @ts-ignore
    res.status(500).send({ error: error.message });
  }
});

//This endpoint will get all jobs which contain the search terms of title and location
app.get("/jobs/:jobTitle/:jobLocation", async (req, res) => {
  try {
    const { jobTitle, jobLocation } = req.params;

    const jobs = await prisma.job.findMany({
      where: {
        title: { contains: jobTitle },
        location: { contains: jobLocation },
      },
      include: { company: true, details: true },
    });

    res.send(jobs);
  } catch (error) {
    // @ts-ignore
    res.status(500).send({ error: error.message });
  }
});

//This endpoint will get all jobs
app.get("/jobs", async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      include: { company: true, details: true },
    });

    res.send(jobs);
  } catch (error) {
    // @ts-ignore
    res.status(500).send({ error: error.message });
  }
});

//This endpoint will get job by id
app.get("/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id: Number(id) },
      include: { company: true, details: true },
    });

    res.send(job);
  } catch (error) {
    // @ts-ignore
    res.status(500).send({ error: error.message });
  }
});

//This endpoint will get all companies
app.get("/companies", async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: { reviews: true, jobs: true },
    });

    res.send(companies);
  } catch (error) {
    // @ts-ignore
    res.status(500).send({ error: error.message });
  }
});

app.get("/companies/company/:name", async (req, res) => {
  try {
    const { name } = req.params;

    const companies = await prisma.company.findMany({
      where: { name: { contains: name } },
      include: { reviews: true, jobs: true },
    });

    res.send(companies);
  } catch (error) {
    // @ts-ignore
    res.status(500).send({ error: error.message });
  }
});

//This endpoint will get company by id
app.get("/companies/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id: Number(id) },
      include: { reviews: true, jobs: true },
    });
    if (company) {
      res.send(company);
    } else {
      res.status(404).send({ error: "Company not found!" });
    }
  } catch (error) {
    // @ts-ignore
    res.status(500).send({ error: error.message });
  }
});

//This endpoint will get all reviews for a company
app.get("/companies/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;

    const reviews = await prisma.review.findMany({
      where: { companyId: Number(id) },
      include: { company: true, user: true },
    });

    res.send(reviews);
  } catch (error) {
    // @ts-ignore
    res.status(500).send({ error: error.message });
  }
});

//Get all reviews for the current user
app.get("/user/reviews", async (req, res) => {
  try {
    // @ts-ignore
    const user = await getCurrentUser(req.headers.authorization);
    if (user) {
      const reviews = await prisma.review.findMany({
        where: { userId: user.id },
        include: { company: true, user: true },
      });

      res.send(reviews);
    } else {
      res
        .status(401)
        .send({ error: "You need to be signed in to unlock this feature!" });
    }
  } catch (error) {
    // @ts-ignore
    res.status(500).send({ error: error.message });
  }
});

//This endpoint will post a new job
app.post("/jobs", async (req, res) => {
  try {
    const { title, location, jobSummary, jobDescription, details, companyId } =
      req.body;

    const detail1 = details[0];
    const detail2 = details[1];
    const detail3 = details[2];

    let errors: string[] = [];

    if (typeof title !== "string") {
      errors.push("Add a proper Title!");
    }
    if (typeof location !== "string") {
      errors.push("Add a proper Location!");
    }
    if (typeof jobSummary !== "string") {
      errors.push("Add a proper JobSummary");
    }
    if (typeof jobDescription !== "string") {
      errors.push("Add a proper JobDescription");
    }
    if (typeof companyId !== "number") {
      errors.push("Add a proper company ID");
    }
    if (!details) errors.push("Missing details");
    if (errors.length === 0) {
      const job = await prisma.job.create({
        data: {
          title,
          location,
          jobSummary,
          jobDescription,
          company: { connect: { id: Number(companyId) } },
          details: {
            // details.map((detail) => ({ id: detail.id }))
            connectOrCreate: [
              {
                where: { content: detail1 },
                create: { content: detail1 },
              },
              {
                where: { content: detail2 },
                create: { content: detail2 },
              },
              {
                where: { content: detail3 },
                create: { content: detail3 },
              },
            ],
          },
        },
        include: { company: true, details: true },
      });

      res.send(job);
    } else {
      res.status(400).send({ errors: errors });
    }
  } catch (error) {
    // @ts-ignore
    res.status(500).send({ error: error.message });
  }
});

//get all users
app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.send(users);
});

//post reviews
app.post("/reviews", async (req, res) => {
  const reviews = {
    content: req.body.content,
    companyId: req.body.companyId,
    userId: req.body.userId,
    rating: req.body.rating,
  };
  let errors: string[] = [];

  if (typeof req.body.content !== "string") {
    errors.push("Add a proper content!");
  }
  if (typeof req.body.companyId !== "number") {
    errors.push("Add a proper company Id!");
  }
  if (typeof req.body.userId !== "number") {
    errors.push("Add a proper user Id");
  }
  if (typeof req.body.rating !== "number") {
    errors.push("Add a proper rating");
  }
  if (errors.length === 0) {
    try {
      const newReview = await prisma.review.create({
        data: {
          content: reviews.content,
          companyId: reviews.companyId,
          userId: reviews.userId,
          rating: reviews.rating,
        },
      });
      res.send(newReview);
    } catch (err) {
      // @ts-ignore
      res.status(400).send(err.message);
    }
  } else {
    res.status(400).send({ errors: errors });
  }
});

app.listen(port, () => {
  console.log(`Listening to http://localhost:${port}`);
});

import { PrismaClient } from "@prisma/client";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import env from "dotenv";

env.config();
const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

const port = 3005;

//get all users
app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.send(users);
});
//get reviews by id
app.get("/reviews/:id", async (req, res) => {
  const review = await prisma.review.findUnique({
    where: { id: Number(req.params.id) }
  });
  if (review) {
    res.send(review);
  } else {
    res.status(404).send({ error: "Review not found." });
  }
});
//get company by id
app.get("/companies/:id", async (req, res) => {
  const company = await prisma.company.findUnique({
    where: { id: Number(req.params.id) }
  });
  if (company) {
    res.send(company);
  } else {
    res.status(404).send({ error: "Company not found." });
  }
});

//post jobs
app.post("/jobs", async (req, res) => {
  const jobs = {
    title: req.body.title,
    location: req.body.location,
    jobSummary: req.body.jobSummary,
    jobDescription: req.body.jobDescription,
    details: req.body.details? req.body.details:[],
    companyId: req.body.companyId,
    jobApplication: req.body.jobApplication? req.body.jobApplication:[]
  };
  let errors: string[] = [];

  if (typeof req.body.title !== "string") {
    errors.push("Add a proper Title!");
  }
  if (typeof req.body.location !== "string") {
    errors.push("Add a proper Location!");
  }
  if (typeof req.body.jobSummary !== "string") {
    errors.push("Add a proper JobSummary");
  }
  if (typeof req.body.jobDescription !== "string") {
    errors.push("Add a proper JobDescription");
  }
  if (typeof req.body.companyId !== "number") {
    errors.push("Add a proper company ID");
  }
  if (errors.length === 0) {
    try {
      const newJob = await prisma.job.create({
        data: {
          title:jobs.title,
          location: jobs.location,
          jobSummary:jobs.jobSummary,
          jobDescription:jobs.jobDescription,
          details: {
            // @ts-ignore
            connectOrCreate: jobs.details.map(detail => ({
              where: { id: detail },
              create: { id: detail }
            }))
          },
          companyId:jobs.companyId,
          jobApplication: {
            // @ts-ignore
            connectOrCreate: jobs.jobApplication.map(jobApplication => ({
              where: { id: jobApplication },
              create: { id: jobApplication }
            }))
          }
        }
      });
      res.send(newJob);
    } catch (err) {
      // @ts-ignore
      res.status(400).send(err.message);
    }
  } else {
    res.status(400).send({ errors: errors });
  }
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
        }
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

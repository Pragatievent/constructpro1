import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Auth Middleware
export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: 'Server JWT configuration missing' });

  jwt.verify(token, secret, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Validation Schemas
const ProjectSchema = z.object({
  name: z.string().min(2),
  clientName: z.string().min(2),
  location: z.string().min(2),
  constructionType: z.enum(['RESIDENTIAL', 'COMMERCIAL']),
  structureType: z.enum(['RCC_FRAMED', 'LOAD_BEARING']),
  floors: z.number().int().min(1).max(150),
  plotLength: z.number().nonnegative(),
  plotWidth: z.number().nonnegative(),
  builtUpArea: z.number().nonnegative(),
  startDate: z.string(),
  description: z.string().optional(),
});

// Health Endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'CONSTRUCT PRO REST API', timestamp: new Date().toISOString() });
});

// Get All Projects with Relations
app.get('/api/projects', authenticateToken, async (req: any, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user.id },
      include: {
        rooms: true,
        rccMembers: true,
        steelEntries: true,
        masonryWalls: true,
        flooringEntries: true,
        plasterEntries: true,
        paintingEntries: true,
        mepItems: true,
        labourEntries: true,
        customMaterials: true,
        boqItems: true,
        historyLogs: { orderBy: { timestamp: 'desc' }, take: 20 }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch projects', details: error.message });
  }
});

// Create Project
app.post('/api/projects', authenticateToken, async (req: any, res) => {
  try {
    const parsed = ProjectSchema.parse(req.body);
    const project = await prisma.project.create({
      data: {
        ...parsed,
        startDate: new Date(parsed.startDate),
        userId: req.user.id,
        historyLogs: {
          create: { action: 'CREATED', details: `Project "${parsed.name}" created.` }
        }
      }
    });
    res.status(201).json(project);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', issues: error.issues });
    }
    res.status(500).json({ error: 'Failed to create project', details: error.message });
  }
});

// Update Project
app.put('/api/projects/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...req.body,
        historyLogs: {
          create: { action: 'UPDATED', details: 'Project parameters and estimates updated.' }
        }
      }
    });
    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update project', details: error.message });
  }
});

// Delete Project
app.delete('/api/projects/:id', authenticateToken, async (req: any, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete project', details: error.message });
  }
});

// Rates CRUD
app.get('/api/rates', authenticateToken, async (_req, res) => {
  try {
    const rates = await prisma.rateItem.findMany({
      include: { history: { orderBy: { changedAt: 'desc' } } }
    });
    res.json(rates);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch rates', details: error.message });
  }
});

app.put('/api/rates/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rateInr, note } = req.body;
    const existing = await prisma.rateItem.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Rate item not found' });

    const updated = await prisma.rateItem.update({
      where: { id },
      data: {
        rateInr: Number(rateInr),
        history: {
          create: {
            oldRateInr: existing.rateInr,
            newRateInr: Number(rateInr),
            note: note || 'Rate updated via Rate Management'
          }
        }
      },
      include: { history: true }
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update rate', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`CONSTRUCT PRO Backend API running on port ${PORT}`);
});

import Dexie, { Table } from 'dexie';
import { NotebookDocument } from '../types/document';

export interface CustomTemplateRecord {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: number;
}

export interface AssetRecord {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: number;
}

export class OneBookDatabase extends Dexie {
  documents!: Table<NotebookDocument, string>;
  templates!: Table<CustomTemplateRecord, string>;
  assets!: Table<AssetRecord, string>;

  constructor() {
    super('OneBookDatabase');
    this.version(1).stores({
      documents: 'id, title, updatedAt, createdAt',
      templates: 'id, name, createdAt',
      assets: 'id, name, createdAt'
    });
  }
}

export const db = new OneBookDatabase();

export const DEFAULT_SEED_DOCUMENTS: NotebookDocument[] = [
  {
    id: 'doc-welcome-sample',
    title: 'Welcome to One Book',
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 2,
    folderId: 'folder-personal',
    settings: {
      mode: 'split-pages',
      scrollDirection: 'vertical',
      page: {
        size: 'A4',
        orientation: 'portrait',
        backgroundColor: '#fbfbf8',
        template: { type: 'oxford', variation: 'standard' }
      }
    },
    content: {
      pageCount: 1,
      textHtml: `<h1>One Book — Samsung Notes Inspired</h1>
<p>Modern minimalist digital notebook with instant response handwriting and fast document navigation.</p>`,
      strokes: [
        {
          id: 's-1',
          tool: 'fountain',
          lineType: 'pressure-variable',
          width: 3,
          color: '#1a1918',
          points: [
            { x: 100, y: 150 },
            { x: 140, y: 120 },
            { x: 180, y: 160 },
            { x: 220, y: 130 }
          ]
        }
      ],
      shapes: [],
      images: []
    }
  },
  {
    id: 'doc-physics-notes',
    title: 'Rotational Motion & Kinematics',
    createdAt: Date.now() - 3600000 * 48,
    updatedAt: Date.now() - 3600000 * 5,
    folderId: 'folder-physics-11',
    settings: {
      mode: 'split-pages',
      scrollDirection: 'vertical',
      page: {
        size: 'A4',
        orientation: 'portrait',
        backgroundColor: '#ffffff',
        template: { type: 'grid', variation: 'standard' }
      }
    },
    content: {
      pageCount: 2,
      textHtml: `<h2>11th Physics - Chapter 7</h2><p>Torque = I * alpha. Moment of Inertia calculations for thin cylindrical shells and uniform discs.</p>`,
      strokes: [
        {
          id: 's-phys-1',
          tool: 'ballpoint',
          lineType: 'uniform',
          width: 2.5,
          color: '#1c1917',
          points: [
            { x: 80, y: 140 },
            { x: 280, y: 140 }
          ]
        }
      ],
      shapes: [],
      images: []
    }
  },
  {
    id: 'doc-math-vectors',
    title: '3D Geometry & Vectors',
    createdAt: Date.now() - 3600000 * 72,
    updatedAt: Date.now() - 3600000 * 12,
    folderId: 'folder-math-12',
    settings: {
      mode: 'split-pages',
      scrollDirection: 'vertical',
      page: {
        size: 'A4',
        orientation: 'portrait',
        backgroundColor: '#fbfbf8',
        template: { type: 'grid', variation: 'standard' }
      }
    },
    content: {
      pageCount: 1,
      textHtml: `<h2>12th Math - Vector Algebra</h2><p>Dot product, Cross product, Shortest distance between skew lines formula.</p>`,
      strokes: [],
      shapes: [],
      images: []
    }
  },
  {
    id: 'doc-coaching-schedule',
    title: 'Weekly Test Schedule & Syllabus',
    createdAt: Date.now() - 3600000 * 96,
    updatedAt: Date.now() - 3600000 * 18,
    folderId: 'folder-brilliant',
    settings: {
      mode: 'split-pages',
      scrollDirection: 'vertical',
      page: {
        size: 'A4',
        orientation: 'portrait',
        backgroundColor: '#ffffff',
        template: { type: 'lined', variation: 'standard' }
      }
    },
    content: {
      pageCount: 1,
      textHtml: `<h2>Brilliant Coaching - Mains & Advanced Prep</h2><p>Sunday Mock Exam 09:00 - 12:00. Revision checklist for Organic Chemistry mechanisms.</p>`,
      strokes: [],
      shapes: [],
      images: []
    }
  },
  {
    id: 'doc-junk-draft',
    title: 'Old Scratchpad Draft',
    createdAt: Date.now() - 3600000 * 120,
    updatedAt: Date.now() - 3600000 * 30,
    folderId: 'folder-junk',
    settings: {
      mode: 'split-pages',
      scrollDirection: 'vertical',
      page: {
        size: 'A4',
        orientation: 'portrait',
        backgroundColor: '#f2f1ee',
        template: { type: 'blank', variation: 'standard' }
      }
    },
    content: {
      pageCount: 1,
      textHtml: `<p>Temporary math scratchpad calculations...</p>`,
      strokes: [],
      shapes: [],
      images: []
    }
  }
];

export const DEFAULT_SEED_DOCUMENT = DEFAULT_SEED_DOCUMENTS[0];

export async function initializeDatabase(): Promise<NotebookDocument> {
  const count = await db.documents.count();
  if (count === 0) {
    await db.documents.bulkAdd(DEFAULT_SEED_DOCUMENTS);
    return DEFAULT_SEED_DOCUMENTS[0];
  }
  const mostRecent = await db.documents.orderBy('updatedAt').reverse().first();
  return mostRecent || DEFAULT_SEED_DOCUMENTS[0];
}

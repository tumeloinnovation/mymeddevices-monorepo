import type { Category } from '../types';

export const SEED_CATEGORIES: Category[] = [
  // ── ROOT CATEGORIES ────────────────────────────────────────────────────────
  {
    id: 1,
    name: 'Monitoring Devices',
    slug: 'monitoring-devices',
    parent: 0,
    description:
      'Medical monitoring equipment for home and clinical use. Track vital signs with accuracy and ease.',
    display: 'default',
    image: {
      id: 1,
      src: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop&auto=format',
      name: 'Monitoring Devices',
      alt: 'Medical monitoring devices',
    },
    count: 24,
  },
  {
    id: 2,
    name: 'Mobility & Rehabilitation Aids',
    slug: 'mobility-rehabilitation-aids',
    parent: 0,
    description:
      'Wheelchairs, walkers, crutches and rehabilitation equipment to support independent living.',
    display: 'default',
    image: {
      id: 2,
      src: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=400&fit=crop&auto=format',
      name: 'Mobility Aids',
      alt: 'Mobility and rehabilitation aids',
    },
    count: 18,
  },
  {
    id: 3,
    name: 'Respiratory Equipment',
    slug: 'respiratory-equipment',
    parent: 0,
    description:
      'Nebulizers, CPAP machines, oxygen concentrators and respiratory therapy equipment.',
    display: 'default',
    image: {
      id: 3,
      src: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop&auto=format',
      name: 'Respiratory Equipment',
      alt: 'Respiratory equipment',
    },
    count: 12,
  },
  {
    id: 4,
    name: 'Diagnostic Devices',
    slug: 'diagnostic-devices',
    parent: 0,
    description:
      'Stethoscopes, otoscopes, ECG machines and other diagnostic tools.',
    display: 'default',
    image: {
      id: 4,
      src: 'https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=400&h=400&fit=crop&auto=format',
      name: 'Diagnostic Devices',
      alt: 'Diagnostic medical devices',
    },
    count: 15,
  },
  {
    id: 5,
    name: 'Home Care Equipment',
    slug: 'home-care-equipment',
    parent: 0,
    description:
      'Hospital beds, patient lifts, and home care solutions for comfortable recovery.',
    display: 'default',
    image: {
      id: 5,
      src: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=400&fit=crop&auto=format',
      name: 'Home Care Equipment',
      alt: 'Home care medical equipment',
    },
    count: 10,
  },
  {
    id: 6,
    name: 'Orthotics & Braces',
    slug: 'orthotics-braces',
    parent: 0,
    description:
      'Knee braces, ankle supports, back braces and orthotic devices for pain relief and injury recovery.',
    display: 'default',
    image: {
      id: 6,
      src: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&auto=format',
      name: 'Orthotics and Braces',
      alt: 'Orthotic devices and braces',
    },
    count: 14,
  },

  // ── CHILDREN OF: Monitoring Devices (id: 1) ────────────────────────────────
  {
    id: 11,
    name: 'Blood Pressure Monitors',
    slug: 'blood-pressure-monitors',
    parent: 1,
    description:
      'Digital and automatic blood pressure monitors for accurate home monitoring.',
    display: 'default',
    image: {
      id: 11,
      src: 'https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?w=400&h=400&fit=crop&auto=format',
      name: 'Blood Pressure Monitors',
      alt: 'Blood pressure monitor',
    },
    count: 8,
  },
  {
    id: 12,
    name: 'Glucose Monitors',
    slug: 'glucose-monitors',
    parent: 1,
    description:
      'Glucometers and continuous glucose monitoring systems for diabetes management.',
    display: 'default',
    image: {
      id: 12,
      src: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=400&fit=crop&auto=format',
      name: 'Glucose Monitors',
      alt: 'Glucose monitoring device',
    },
    count: 6,
  },
  {
    id: 13,
    name: 'Pulse Oximeters',
    slug: 'pulse-oximeters',
    parent: 1,
    description:
      'Fingertip and handheld pulse oximeters for measuring blood oxygen saturation.',
    display: 'default',
    image: {
      id: 13,
      src: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop&auto=format',
      name: 'Pulse Oximeters',
      alt: 'Pulse oximeter device',
    },
    count: 5,
  },
  {
    id: 14,
    name: 'Thermometers',
    slug: 'thermometers',
    parent: 1,
    description:
      'Digital, infrared and forehead thermometers for accurate temperature measurement.',
    display: 'default',
    image: {
      id: 14,
      src: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&h=400&fit=crop&auto=format',
      name: 'Thermometers',
      alt: 'Digital thermometer',
    },
    count: 5,
  },

  // ── CHILDREN OF: Mobility & Rehabilitation Aids (id: 2) ────────────────────
  {
    id: 21,
    name: 'Wheelchairs',
    slug: 'wheelchairs',
    parent: 2,
    description:
      'Manual and electric wheelchairs for all ages and mobility levels.',
    display: 'default',
    image: {
      id: 21,
      src: 'https://images.unsplash.com/photo-1573883431205-98b5f10aaedb?w=400&h=400&fit=crop&auto=format',
      name: 'Wheelchairs',
      alt: 'Wheelchair',
    },
    count: 6,
  },
  {
    id: 22,
    name: 'Walking Frames & Rollators',
    slug: 'walking-frames-rollators',
    parent: 2,
    description:
      'Walking frames, rollators and Zimmer frames for stability and independence.',
    display: 'default',
    image: {
      id: 22,
      src: 'https://images.unsplash.com/photo-1606902965551-dce093cda6eb?w=400&h=400&fit=crop&auto=format',
      name: 'Walking Frames',
      alt: 'Walking frame and rollator',
    },
    count: 5,
  },
  {
    id: 23,
    name: 'Crutches & Walking Sticks',
    slug: 'crutches-walking-sticks',
    parent: 2,
    description:
      'Axillary crutches, forearm crutches, walking canes and tripod sticks.',
    display: 'default',
    image: {
      id: 23,
      src: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400&h=400&fit=crop&auto=format',
      name: 'Crutches',
      alt: 'Crutches and walking sticks',
    },
    count: 7,
  },

  // ── CHILDREN OF: Respiratory Equipment (id: 3) ─────────────────────────────
  {
    id: 31,
    name: 'Nebulizers',
    slug: 'nebulizers',
    parent: 3,
    description:
      'Compressor and mesh nebulizers for asthma, bronchitis and respiratory treatments.',
    display: 'default',
    image: {
      id: 31,
      src: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop&auto=format',
      name: 'Nebulizers',
      alt: 'Medical nebulizer',
    },
    count: 4,
  },
  {
    id: 32,
    name: 'CPAP & BiPAP Machines',
    slug: 'cpap-bipap-machines',
    parent: 3,
    description:
      'CPAP and BiPAP therapy machines for sleep apnea and respiratory support.',
    display: 'default',
    image: {
      id: 32,
      src: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop&auto=format',
      name: 'CPAP Machines',
      alt: 'CPAP machine for sleep apnea',
    },
    count: 4,
  },
  {
    id: 33,
    name: 'Oxygen Concentrators',
    slug: 'oxygen-concentrators',
    parent: 3,
    description:
      'Portable and home oxygen concentrators for supplemental oxygen therapy.',
    display: 'default',
    image: {
      id: 33,
      src: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=400&fit=crop&auto=format',
      name: 'Oxygen Concentrators',
      alt: 'Oxygen concentrator machine',
    },
    count: 4,
  },

  // ── CHILDREN OF: Diagnostic Devices (id: 4) ────────────────────────────────
  {
    id: 41,
    name: 'Stethoscopes',
    slug: 'stethoscopes',
    parent: 4,
    description: 'Cardiology, general purpose and electronic stethoscopes.',
    display: 'default',
    image: {
      id: 41,
      src: 'https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=400&h=400&fit=crop&auto=format',
      name: 'Stethoscopes',
      alt: 'Medical stethoscope',
    },
    count: 5,
  },
  {
    id: 42,
    name: 'Otoscopes & Ophthalmoscopes',
    slug: 'otoscopes-ophthalmoscopes',
    parent: 4,
    description: 'Diagnostic ear and eye examination instruments.',
    display: 'default',
    image: {
      id: 42,
      src: 'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=400&h=400&fit=crop&auto=format',
      name: 'Otoscopes',
      alt: 'Otoscope for ear examination',
    },
    count: 5,
  },
  {
    id: 43,
    name: 'ECG Machines',
    slug: 'ecg-machines',
    parent: 4,
    description:
      'Portable and clinical electrocardiogram machines for heart monitoring.',
    display: 'default',
    image: {
      id: 43,
      src: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop&auto=format',
      name: 'ECG Machines',
      alt: 'ECG machine',
    },
    count: 5,
  },

  // ── CHILDREN OF: Home Care Equipment (id: 5) ───────────────────────────────
  {
    id: 51,
    name: 'Hospital Beds',
    slug: 'hospital-beds',
    parent: 5,
    description:
      'Manual and electric hospital beds for home care and recovery.',
    display: 'default',
    image: {
      id: 51,
      src: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=400&fit=crop&auto=format',
      name: 'Hospital Beds',
      alt: 'Hospital bed for home use',
    },
    count: 4,
  },
  {
    id: 52,
    name: 'Patient Lifts & Hoists',
    slug: 'patient-lifts-hoists',
    parent: 5,
    description:
      'Transfer belts, patient hoists and ceiling track lifts for safe patient handling.',
    display: 'default',
    image: {
      id: 52,
      src: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=400&fit=crop&auto=format',
      name: 'Patient Lifts',
      alt: 'Patient lift and hoist',
    },
    count: 6,
  },

  // ── CHILDREN OF: Orthotics & Braces (id: 6) ────────────────────────────────
  {
    id: 61,
    name: 'Knee & Ankle Supports',
    slug: 'knee-ankle-supports',
    parent: 6,
    description:
      'Knee braces, ankle supports, compression sleeves and joint stabilizers.',
    display: 'default',
    image: {
      id: 61,
      src: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&auto=format',
      name: 'Knee and Ankle Supports',
      alt: 'Knee and ankle support brace',
    },
    count: 8,
  },
  {
    id: 62,
    name: 'Back & Lumbar Supports',
    slug: 'back-lumbar-supports',
    parent: 6,
    description:
      'Lumbar belts, posture correctors and back braces for spine support.',
    display: 'default',
    image: {
      id: 62,
      src: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400&h=400&fit=crop&auto=format',
      name: 'Back Supports',
      alt: 'Back and lumbar support brace',
    },
    count: 6,
  },
];

export function buildCategoryTree(categories: Category[]): Category[] {
  const map = new Map<string | number, Category>();
  const roots: Category[] = [];

  categories.forEach(cat => map.set(cat.id, { ...cat, subCategories: [] }));

  categories.forEach(cat => {
    const node = map.get(cat.id)!;
    if (cat.parent === 0) {
      roots.push(node);
    } else {
      const parent = map.get(cat.parent);
      if (parent) parent.subCategories!.push(node);
    }
  });

  return roots;
}

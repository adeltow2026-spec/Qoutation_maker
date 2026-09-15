import { AppDatabase } from '../types';

export const INITIAL_DATABASE: AppDatabase = {
  customers: [
    {
      id: 1,
      name: 'ABC Trading LLC',
      email: 'procurement@abctrading.ae',
      phone: '+971 4 398 2200',
      address: 'Business Bay, Tower B, Office 1402, Dubai, UAE',
      trn: '100234567800003',
    },
    {
      id: 2,
      name: 'Global Construction LLC',
      email: 'contracts@globalconst.ae',
      phone: '+971 2 642 1155',
      address: 'Al Reem Island, Sky Tower, Abu Dhabi, UAE',
      trn: '100456789000003',
    },
    {
      id: 3,
      name: 'Dubai Interiors & Fitout',
      email: 'info@dubaiinteriors.com',
      phone: '+971 4 885 9940',
      address: 'Al Quoz Industrial Area 3, Dubai, UAE',
      trn: '100876543200003',
    },
    {
      id: 4,
      name: 'Emaar Hospitality Group',
      email: 'purchasing@emaar.com',
      phone: '+971 4 367 3333',
      address: 'Downtown Dubai, UAE',
      trn: '100998877600003',
    }
  ],
  library: [
    {
      id: 'p-1',
      code: 'WIN-ALM-120',
      desc: 'Thermal Break Aluminium Window (1200x1200mm, Double Glazed 6+12A+6mm)',
      category: 'Windows & Facades',
      unit: 'm²',
      price: 280.00,
      tax: 5,
      notes: 'Profile: Technal / Gutmann powder coated RAL 7016'
    },
    {
      id: 'p-2',
      code: 'DOOR-GLS-210',
      desc: 'Frameless Heavy Duty Glass Door (900x2100mm, 12mm Clear Toughened)',
      category: 'Doors & Partitions',
      unit: 'pcs',
      price: 750.00,
      tax: 5,
      notes: 'Includes top/bottom patch fittings & floor spring'
    },
    {
      id: 'p-3',
      code: 'ALM-PROF-01',
      desc: 'Extruded Aluminium Profile 6063-T6 (Powder Coated)',
      category: 'Raw Materials',
      unit: 'kg',
      price: 24.50,
      tax: 5,
      notes: 'Standard architectural alloy'
    },
    {
      id: 'p-4',
      code: 'GLS-TMP-10',
      desc: '10mm Clear Toughened Glass with Polished Edges',
      category: 'Raw Materials',
      unit: 'm²',
      price: 135.00,
      tax: 5,
      notes: 'Standard safety glass'
    },
    {
      id: 'p-5',
      code: 'GLS-DGU-24',
      desc: 'Double Glazed Unit 24mm (6mm Low-E + 12mm Argon + 6mm Clear)',
      category: 'Raw Materials',
      unit: 'm²',
      price: 195.00,
      tax: 5,
      notes: 'High acoustic and thermal rating'
    },
    {
      id: 'p-6',
      code: 'HDW-SS-HDL',
      desc: 'Stainless Steel Pull Handle 316 Grade (600mm Length, Matt Finish)',
      category: 'Hardware & Fittings',
      unit: 'pair',
      price: 120.00,
      tax: 5,
      notes: 'Grade 316 marine-grade stainless'
    },
    {
      id: 'p-7',
      code: 'HDW-FLR-SPG',
      desc: 'DORMA / Geze Heavy Duty Floor Spring (EN 3-6 with Accessories)',
      category: 'Hardware & Fittings',
      unit: 'set',
      price: 450.00,
      tax: 5,
      notes: 'Includes cement box and spindle'
    },
    {
      id: 'p-8',
      code: 'HDW-LCK-SET',
      desc: 'Euro Profile Mortise Lock Case with Keyed-Alike Cylinder',
      category: 'Hardware & Fittings',
      unit: 'set',
      price: 165.00,
      tax: 5,
      notes: 'Includes 3 computer keys'
    },
    {
      id: 'p-9',
      code: 'LAB-FAB-01',
      desc: 'Factory Fabrication & Assembly Labor',
      category: 'Labor & Services',
      unit: 'hours',
      price: 45.00,
      tax: 5,
      notes: 'Trained technician shop hours'
    },
    {
      id: 'p-10',
      code: 'LAB-INST-02',
      desc: 'On-Site Installation & Glazing Service',
      category: 'Labor & Services',
      unit: 'm²',
      price: 85.00,
      tax: 5,
      notes: 'Includes certified scaffolding and safety riggers'
    },
    {
      id: 'p-11',
      code: 'SEAL-STR-01',
      desc: 'Structural Silicone Weatherproofing Sealant (Dow Corning 791)',
      category: 'Consumables & Sealants',
      unit: 'sausage',
      price: 32.00,
      tax: 5,
      notes: '600ml foil sausage black/grey'
    },
    {
      id: 'p-12',
      code: 'TRN-LOC-01',
      desc: 'Local Site Transportation & Flatbed Delivery',
      category: 'Logistics & Transport',
      unit: 'trip',
      price: 250.00,
      tax: 5,
      notes: 'Within Dubai / Sharjah / Abu Dhabi'
    },
    {
      id: 'p-13',
      code: 'DSG-ENG-01',
      desc: 'Shop Drawings & Structural Engineering Submittal',
      category: 'Engineering & Consulting',
      unit: 'job',
      price: 800.00,
      tax: 5,
      notes: 'Includes municipality approved structural calculations'
    }
  ],
  quotes: [],
  draft: null,
  settings: {
    name: 'Touch Of Wood Decoration Works LLC',
    logoText: 'TOUCH OF WOOD',
    logoUrl: '/touch_of_wood_logo.jpg',
    phone: '+971 2 550 1234',
    email: 'tow@touchofwood.ae',
    address: 'Musaffah ICAD, Abu Dhabi, UAE',
    trn: '100519825200003',
    website: 'Touchofwood.ae',
    tax: 5,
    currency: 'AED',
    overheadPct: 30,
    markupPct: 40,
    completionTerms:
      '20 Working Days from the date of Advance Payment, after all measurements are taken from the site and approved Drawings.',
    paymentTerms:
      '• 60% in advance along with the order confirmation\n• 30% progressive painting works\n• 10% progressive bill prior delivery',
    bankDetails: {
      accountName: 'Touch of Wood Decoration Works LLC',
      bankName: 'Wio Bank P.J.S.C.',
      currency: 'AED',
      iban: 'AE420860000009234574205',
      swift: 'WIOBAEADXXX',
      accountNumber: '9234574205',
    },
    defaultNotes:
      '• Payment Terms:\n  - 60% in advance along with the order confirmation\n  - 30% progressive painting works\n  - 10% progressive bill prior delivery\n• Completion of Works: 20 Working Days from the date of Advance Payment, after all measurements are taken from the site and approved Drawings.',
    defaultTerms: `1. Our offer covers only the scope of works mentioned in the quotation based on the above Bill of Quantities and Any Additional items required and not mentioned above will be considered as a variation order.
2. This Quotation Based on your key plan, If any Different on site actual dimension it will Affect price.
3. This Quotation Based on your design, If any Different on the design will Affect price.
4. Excluded All civil works.
5. We should have 24/7 access to the project site and our team should be allowed to work at all hours.
6. The above proposal includes Supply and Installations.
7. Quotation Include Only Walnut, Oak, Ash, Beach Veneer and Another Select Veneer Extra Charge as per sample.
8. All Electrical Work Extra Charge as per Site Condition.
9. Charging for delivery Sample and Pickup Sample (200 AED).
10. The accountability of the approval laminate sheet is on the client. Sample has to be confirmed for this work.
11. Please read the contract carefully.`,
  },
  users: [
    {
      id: 'u-1',
      name: 'Adel',
      email: 'adel.tow.2026@gmail.com',
      phone: '+971 50 123 4567',
      role: 'Managing Estimator / Director',
      avatarInitials: 'AD',
    },
    {
      id: 'u-2',
      name: 'Touch Of Wood Sales Team',
      email: 'tow@touchofwood.ae',
      phone: '+971 2 550 1234',
      role: 'Commercial Estimating Team',
      avatarInitials: 'TOW',
    },
    {
      id: 'u-3',
      name: 'Senior Project Estimator',
      email: 'projects@touchofwood.ae',
      phone: '+971 2 550 1234',
      role: 'Joinery & Fit-out Specialist',
      avatarInitials: 'PE',
    },
  ],
  currentUserId: 'u-1',
  nextQuote: 45,
  nextCustomer: 5
};

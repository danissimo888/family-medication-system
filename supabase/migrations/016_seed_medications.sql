-- Seed medications: 20 common chronic disease drugs

INSERT INTO medications (generic_name, brand_name, dosage_form, strength, manufacturer, description, side_effects) VALUES
    ('Metformin',       'Glucophage',   'tablet',    '500 mg',  'Merck',             'Oral antidiabetic for type 2 diabetes',                  'Nausea, diarrhea, stomach pain, metallic taste'),
    ('Amlodipine',      'Norvasc',      'tablet',    '5 mg',    'Pfizer',            'Calcium channel blocker for hypertension and angina',     'Swelling of ankles, dizziness, flushing, fatigue'),
    ('Lisinopril',      'Zestril',      'tablet',    '10 mg',   'AstraZeneca',       'ACE inhibitor for hypertension and heart failure',        'Dry cough, dizziness, headache, hyperkalemia'),
    ('Atorvastatin',    'Lipitor',      'tablet',    '20 mg',   'Pfizer',            'Statin for high cholesterol',                             'Muscle pain, joint pain, diarrhea, nausea'),
    ('Omeprazole',      'Prilosec',     'capsule',   '20 mg',   'AstraZeneca',       'Proton pump inhibitor for GERD and ulcers',               'Headache, nausea, diarrhea, stomach pain'),
    ('Losartan',        'Cozaar',       'tablet',    '50 mg',   'Merck',             'ARB for hypertension and diabetic nephropathy',            'Dizziness, back pain, nasal congestion'),
    ('Metoprolol',      'Lopressor',    'tablet',    '50 mg',   'Novartis',          'Beta blocker for hypertension and angina',                 'Fatigue, dizziness, bradycardia, cold extremities'),
    ('Levothyroxine',   'Synthroid',    'tablet',    '50 mcg',  'AbbVie',            'Thyroid hormone replacement for hypothyroidism',           'Weight loss, tremor, headache, insomnia'),
    ('Glimepiride',     'Amaryl',       'tablet',    '2 mg',    'Sanofi',            'Sulfonylurea for type 2 diabetes',                        'Hypoglycemia, dizziness, nausea, weight gain'),
    ('Hydrochlorothiazide', 'Microzide', 'tablet',   '25 mg',   'Various',           'Thiazide diuretic for hypertension and edema',             'Dizziness, dehydration, electrolyte imbalance'),
    ('Warfarin',        'Coumadin',     'tablet',    '5 mg',    'Bristol-Myers Squibb', 'Anticoagulant for blood clot prevention',               'Bleeding, bruising, nausea, hair loss'),
    ('Clopidogrel',     'Plavix',       'tablet',    '75 mg',   'Sanofi',            'Antiplatelet for stroke and heart attack prevention',      'Bleeding, bruising, stomach pain, diarrhea'),
    ('Aspirin',         'Bayer',        'tablet',    '81 mg',   'Bayer',             'Low-dose antiplatelet for cardiovascular prevention',      'Stomach irritation, bleeding, heartburn'),
    ('Insulin Glargine','Lantus',       'injection', '100 U/mL','Sanofi',            'Long-acting insulin for type 1 and 2 diabetes',            'Hypoglycemia, injection site reactions, weight gain'),
    ('Salbutamol',      'Ventolin',     'inhaler',   '100 mcg', 'GSK',               'Short-acting bronchodilator for asthma and COPD',          'Tremor, headache, palpitations, muscle cramps'),
    ('Montelukast',     'Singulair',    'tablet',    '10 mg',   'Merck',             'Leukotriene inhibitor for asthma and allergies',            'Headache, stomach pain, fatigue, dizziness'),
    ('Prednisone',      'Deltasone',    'tablet',    '5 mg',    'Various',           'Corticosteroid for inflammation and autoimmune conditions', 'Weight gain, insomnia, mood changes, increased blood sugar'),
    ('Simvastatin',     'Zocor',        'tablet',    '20 mg',   'Merck',             'Statin for high cholesterol',                              'Muscle pain, constipation, nausea, headache'),
    ('Gabapentin',      'Neurontin',    'capsule',   '300 mg',  'Pfizer',            'Anticonvulsant for neuropathic pain and epilepsy',          'Drowsiness, dizziness, fatigue, weight gain'),
    ('Furosemide',      'Lasix',        'tablet',    '40 mg',   'Sanofi',            'Loop diuretic for edema and heart failure',                 'Dehydration, electrolyte imbalance, dizziness, cramps')
ON CONFLICT DO NOTHING;

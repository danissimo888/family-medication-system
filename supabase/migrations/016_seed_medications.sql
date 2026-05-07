-- Seed medications: 65 real-world chronic disease medications
-- Data researched from clinical sources (see docs/medication-research-sources.md)

INSERT INTO medications (generic_name, brand_name, dosage_form, strength, manufacturer, description, side_effects) VALUES
    -- CARDIOVASCULAR: ACE Inhibitors
    ('Lisinopril',      'Zestril',      'tablet',    '10 mg',   'AstraZeneca',       'ACE inhibitor for hypertension and heart failure',        'Dry cough, dizziness, headache, hyperkalemia'),
    ('Enalapril',       'Vasotec',      'tablet',    '10 mg',   'Valeant',           'ACE inhibitor for hypertension and heart failure',        'Dizziness, headache, fatigue, dry cough'),
    ('Ramipril',        'Altace',       'capsule',   '5 mg',    'Pfizer',            'ACE inhibitor for hypertension and post-MI',              'Cough, dizziness, fatigue, hyperkalemia'),

    -- CARDIOVASCULAR: ARBs
    ('Losartan',        'Cozaar',       'tablet',    '50 mg',   'Merck',             'ARB for hypertension and diabetic nephropathy',           'Dizziness, back pain, nasal congestion, hyperkalemia'),
    ('Valsartan',       'Diovan',       'tablet',    '160 mg',  'Novartis',          'ARB for hypertension and heart failure',                  'Dizziness, fatigue, viral infection, hyperkalemia'),
    ('Irbesartan',      'Avapro',       'tablet',    '150 mg',  'Sanofi',            'ARB for hypertension and diabetic nephropathy',           'Dizziness, fatigue, nausea, hyperkalemia'),

    -- CARDIOVASCULAR: Beta Blockers
    ('Metoprolol',      'Lopressor',    'tablet',    '50 mg',   'Novartis',          'Beta blocker for hypertension and angina',                'Fatigue, dizziness, bradycardia, cold extremities'),
    ('Atenolol',        'Tenormin',     'tablet',    '50 mg',   'AstraZeneca',       'Beta blocker for hypertension and angina',                'Fatigue, dizziness, bradycardia, depression'),
    ('Carvedilol',      'Coreg',        'tablet',    '25 mg',   'GSK',               'Beta blocker for heart failure and hypertension',         'Dizziness, fatigue, hypotension, bradycardia'),
    ('Bisoprolol',      'Zebeta',       'tablet',    '5 mg',    'Duramed',           'Beta blocker for hypertension and heart failure',         'Fatigue, dizziness, bradycardia, headache'),

    -- CARDIOVASCULAR: Calcium Channel Blockers
    ('Amlodipine',      'Norvasc',      'tablet',    '5 mg',    'Pfizer',            'Calcium channel blocker for hypertension and angina',     'Swelling of ankles, dizziness, flushing, fatigue'),
    ('Diltiazem',       'Cardizem',     'tablet',    '180 mg',  'Biovail',           'Calcium channel blocker for hypertension and angina',     'Dizziness, headache, edema, bradycardia'),
    ('Verapamil',       'Calan',        'tablet',    '120 mg',  'Pfizer',            'Calcium channel blocker for hypertension and arrhythmia', 'Constipation, dizziness, headache, bradycardia'),

    -- CARDIOVASCULAR: Statins
    ('Atorvastatin',    'Lipitor',      'tablet',    '20 mg',   'Pfizer',            'Statin for high cholesterol and cardiovascular risk',     'Muscle pain, joint pain, diarrhea, nausea'),
    ('Simvastatin',     'Zocor',        'tablet',    '20 mg',   'Merck',             'Statin for high cholesterol',                             'Muscle pain, constipation, nausea, headache'),
    ('Rosuvastatin',    'Crestor',      'tablet',    '10 mg',   'AstraZeneca',       'High-intensity statin for cholesterol',                   'Muscle pain, headache, nausea, abdominal pain'),
    ('Pravastatin',     'Pravachol',    'tablet',    '40 mg',   'Bristol-Myers Squibb', 'Statin for high cholesterol',                          'Headache, nausea, muscle pain, diarrhea'),

    -- CARDIOVASCULAR: Anticoagulants
    ('Warfarin',        'Coumadin',     'tablet',    '5 mg',    'Bristol-Myers Squibb', 'Anticoagulant for blood clot prevention',              'Bleeding, bruising, nausea, hair loss'),
    ('Apixaban',        'Eliquis',      'tablet',    '5 mg',    'Pfizer/BMS',        'Direct factor Xa inhibitor for stroke prevention',        'Bleeding, bruising, nausea'),
    ('Rivaroxaban',     'Xarelto',      'tablet',    '20 mg',   'Bayer/Janssen',     'Direct factor Xa inhibitor for DVT/PE prevention',        'Bleeding, bruising, back pain'),
    ('Dabigatran',      'Pradaxa',      'capsule',   '150 mg',  'Boehringer Ingelheim', 'Direct thrombin inhibitor for stroke prevention',      'Bleeding, dyspepsia, gastritis'),

    -- CARDIOVASCULAR: Antiplatelets
    ('Aspirin',         'Bayer',        'tablet',    '81 mg',   'Bayer',             'Low-dose antiplatelet for cardiovascular prevention',     'Stomach irritation, bleeding, heartburn'),
    ('Clopidogrel',     'Plavix',       'tablet',    '75 mg',   'Sanofi',            'Antiplatelet for stroke and heart attack prevention',     'Bleeding, bruising, stomach pain, diarrhea'),
    ('Ticagrelor',      'Brilinta',     'tablet',    '90 mg',   'AstraZeneca',       'Antiplatelet for acute coronary syndrome',                'Bleeding, dyspnea, headache, dizziness'),

    -- CARDIOVASCULAR: Diuretics
    ('Hydrochlorothiazide', 'Microzide', 'tablet',   '25 mg',   'Various',           'Thiazide diuretic for hypertension and edema',            'Dizziness, dehydration, electrolyte imbalance'),
    ('Furosemide',      'Lasix',        'tablet',    '40 mg',   'Sanofi',            'Loop diuretic for edema and heart failure',               'Dehydration, electrolyte imbalance, dizziness, cramps'),

    -- DIABETES: Biguanides
    ('Metformin',       'Glucophage',   'tablet',    '500 mg',  'Merck',             'Oral antidiabetic for type 2 diabetes',                  'Nausea, diarrhea, stomach pain, metallic taste'),

    -- DIABETES: SGLT2 Inhibitors
    ('Empagliflozin',   'Jardiance',    'tablet',    '10 mg',   'Boehringer Ingelheim', 'SGLT2 inhibitor for type 2 diabetes and heart failure', 'Urinary tract infections, genital infections, dehydration'),
    ('Dapagliflozin',   'Farxiga',      'tablet',    '10 mg',   'AstraZeneca',       'SGLT2 inhibitor for type 2 diabetes and CKD',            'Urinary tract infections, genital infections, hypotension'),
    ('Canagliflozin',   'Invokana',     'tablet',    '100 mg',  'Janssen',           'SGLT2 inhibitor for type 2 diabetes',                    'Urinary tract infections, genital infections, increased urination'),

    -- DIABETES: GLP-1 Agonists
    ('Semaglutide',     'Ozempic',      'injection', '1 mg/wk', 'Novo Nordisk',      'GLP-1 agonist for type 2 diabetes and weight loss',      'Nausea, vomiting, diarrhea, abdominal pain'),
    ('Liraglutide',     'Victoza',      'injection', '1.8 mg/day', 'Novo Nordisk',   'GLP-1 agonist for type 2 diabetes',                      'Nausea, diarrhea, vomiting, headache'),
    ('Dulaglutide',     'Trulicity',    'injection', '1.5 mg/wk', 'Lilly',           'GLP-1 agonist for type 2 diabetes',                      'Nausea, diarrhea, vomiting, abdominal pain'),

    -- DIABETES: DPP-4 Inhibitors
    ('Sitagliptin',     'Januvia',      'tablet',    '100 mg',  'Merck',             'DPP-4 inhibitor for type 2 diabetes',                    'Upper respiratory infection, headache, nasopharyngitis'),
    ('Linagliptin',     'Tradjenta',    'tablet',    '5 mg',    'Boehringer Ingelheim', 'DPP-4 inhibitor for type 2 diabetes',                 'Nasopharyngitis, hypoglycemia when combined with insulin'),
    ('Saxagliptin',     'Onglyza',      'tablet',    '5 mg',    'AstraZeneca',       'DPP-4 inhibitor for type 2 diabetes',                    'Upper respiratory infection, urinary tract infection, headache'),

    -- DIABETES: Sulfonylureas
    ('Glimepiride',     'Amaryl',       'tablet',    '2 mg',    'Sanofi',            'Sulfonylurea for type 2 diabetes',                       'Hypoglycemia, dizziness, nausea, weight gain'),
    ('Glyburide',       'DiaBeta',      'tablet',    '5 mg',    'Pfizer',            'Sulfonylurea for type 2 diabetes',                       'Hypoglycemia, nausea, heartburn, weight gain'),

    -- DIABETES: Insulin
    ('Insulin Glargine','Lantus',       'injection', '100 U/mL','Sanofi',            'Long-acting insulin for type 1 and 2 diabetes',          'Hypoglycemia, injection site reactions, weight gain'),
    ('Insulin Lispro',  'Humalog',      'injection', '100 U/mL','Lilly',             'Rapid-acting insulin for type 1 and 2 diabetes',         'Hypoglycemia, injection site reactions, lipodystrophy'),
    ('Insulin Aspart',  'Novolog',      'injection', '100 U/mL','Novo Nordisk',      'Rapid-acting insulin for type 1 and 2 diabetes',         'Hypoglycemia, injection site reactions, allergic reactions'),

    -- RESPIRATORY: Short-Acting Beta Agonists
    ('Albuterol',       'Ventolin',     'inhaler',   '90 mcg',  'GSK',               'Short-acting bronchodilator for asthma and COPD',        'Tremor, headache, palpitations, muscle cramps'),
    ('Levalbuterol',    'Xopenex',      'inhaler',   '45 mcg',  'Sunovion',          'Short-acting bronchodilator for asthma and COPD',        'Tremor, nervousness, headache, dizziness'),

    -- RESPIRATORY: Long-Acting Beta Agonists
    ('Salmeterol',      'Serevent',     'inhaler',   '50 mcg',  'GSK',               'Long-acting bronchodilator for asthma and COPD',         'Headache, tremor, palpitations, throat irritation'),
    ('Formoterol',      'Foradil',      'inhaler',   '12 mcg',  'Novartis',          'Long-acting bronchodilator for asthma and COPD',         'Tremor, headache, palpitations, muscle cramps'),

    -- RESPIRATORY: Inhaled Corticosteroids
    ('Fluticasone',     'Flovent',      'inhaler',   '110 mcg', 'GSK',               'Inhaled corticosteroid for asthma maintenance',           'Oral thrush, hoarseness, cough, throat irritation'),
    ('Budesonide',      'Pulmicort',    'inhaler',   '180 mcg', 'AstraZeneca',       'Inhaled corticosteroid for asthma and COPD',             'Oral thrush, hoarseness, cough, headache'),
    ('Beclomethasone',  'Qvar',         'inhaler',   '80 mcg',  'Teva',              'Inhaled corticosteroid for asthma',                       'Oral thrush, hoarseness, cough, headache'),

    -- RESPIRATORY: Anticholinergics
    ('Tiotropium',      'Spiriva',      'inhaler',   '18 mcg',  'Boehringer Ingelheim', 'Long-acting anticholinergic for COPD',                'Dry mouth, constipation, urinary retention, blurred vision'),
    ('Ipratropium',     'Atrovent',     'inhaler',   '17 mcg',  'Boehringer Ingelheim', 'Short-acting anticholinergic for COPD',               'Dry mouth, cough, headache, dizziness'),

    -- RESPIRATORY: Leukotriene Inhibitors
    ('Montelukast',     'Singulair',    'tablet',    '10 mg',   'Merck',             'Leukotriene inhibitor for asthma and allergies',         'Headache, stomach pain, fatigue, dizziness'),

    -- MENTAL HEALTH: SSRIs
    ('Sertraline',      'Zoloft',       'tablet',    '50 mg',   'Pfizer',            'SSRI for depression and anxiety disorders',               'Nausea, diarrhea, insomnia, sexual dysfunction'),
    ('Escitalopram',    'Lexapro',      'tablet',    '10 mg',   'Lundbeck',          'SSRI for depression and generalized anxiety disorder',    'Nausea, insomnia, fatigue, sexual dysfunction'),
    ('Fluoxetine',      'Prozac',       'capsule',   '20 mg',   'Lilly',             'SSRI for depression, OCD, and panic disorder',            'Nausea, insomnia, anxiety, sexual dysfunction'),
    ('Paroxetine',      'Paxil',        'tablet',    '20 mg',   'GSK',               'SSRI for depression and anxiety disorders',               'Nausea, drowsiness, sexual dysfunction, weight gain'),

    -- MENTAL HEALTH: SNRIs
    ('Venlafaxine',     'Effexor XR',   'capsule',   '75 mg',   'Pfizer',            'SNRI for depression and anxiety disorders',               'Nausea, dizziness, insomnia, sweating'),
    ('Duloxetine',      'Cymbalta',     'capsule',   '60 mg',   'Lilly',             'SNRI for depression, anxiety, and neuropathic pain',      'Nausea, dry mouth, drowsiness, constipation'),

    -- MENTAL HEALTH: Benzodiazepines
    ('Lorazepam',       'Ativan',       'tablet',    '1 mg',    'Valeant',           'Benzodiazepine for anxiety and insomnia',                 'Drowsiness, dizziness, weakness, unsteadiness'),
    ('Alprazolam',      'Xanax',        'tablet',    '0.5 mg',  'Pfizer',            'Benzodiazepine for anxiety and panic disorder',           'Drowsiness, dizziness, memory impairment, dependence'),
    ('Diazepam',        'Valium',       'tablet',    '5 mg',    'Roche',             'Benzodiazepine for anxiety, seizures, and muscle spasms', 'Drowsiness, fatigue, muscle weakness, dependence'),
    ('Clonazepam',      'Klonopin',     'tablet',    '1 mg',    'Roche',             'Benzodiazepine for panic disorder and seizures',          'Drowsiness, dizziness, coordination problems, dependence'),

    -- MENTAL HEALTH: Mood Stabilizers
    ('Lithium',         'Lithobid',     'tablet',    '300 mg',  'Various',           'Mood stabilizer for bipolar disorder',                    'Tremor, increased thirst, frequent urination, weight gain'),
    ('Lamotrigine',     'Lamictal',     'tablet',    '100 mg',  'GSK',               'Mood stabilizer for bipolar disorder',                    'Dizziness, headache, blurred vision, rash'),
    ('Valproate',       'Depakote',     'tablet',    '500 mg',  'AbbVie',            'Mood stabilizer for bipolar disorder and seizures',       'Nausea, tremor, weight gain, hair loss'),

    -- OTHER: Corticosteroids
    ('Prednisone',      'Deltasone',    'tablet',    '5 mg',    'Various',           'Corticosteroid for inflammation and autoimmune conditions', 'Weight gain, insomnia, mood changes, increased blood sugar'),

    -- OTHER: Thyroid
    ('Levothyroxine',   'Synthroid',    'tablet',    '50 mcg',  'AbbVie',            'Thyroid hormone replacement for hypothyroidism',          'Weight loss, tremor, headache, insomnia'),

    -- OTHER: Proton Pump Inhibitors
    ('Omeprazole',      'Prilosec',     'capsule',   '20 mg',   'AstraZeneca',       'Proton pump inhibitor for GERD and ulcers',              'Headache, nausea, diarrhea, stomach pain')
ON CONFLICT DO NOTHING;

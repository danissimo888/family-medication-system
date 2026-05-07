-- Add category column to medications table
ALTER TABLE medications ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Update existing medications with categories based on description
UPDATE medications SET category = 'Cardiovascular - ACE Inhibitor' WHERE generic_name IN ('Lisinopril', 'Enalapril', 'Ramipril');
UPDATE medications SET category = 'Cardiovascular - ARB' WHERE generic_name IN ('Losartan', 'Valsartan', 'Irbesartan');
UPDATE medications SET category = 'Cardiovascular - Beta Blocker' WHERE generic_name IN ('Metoprolol', 'Atenolol', 'Carvedilol', 'Bisoprolol');
UPDATE medications SET category = 'Cardiovascular - Calcium Channel Blocker' WHERE generic_name IN ('Amlodipine', 'Diltiazem', 'Verapamil');
UPDATE medications SET category = 'Cardiovascular - Statin' WHERE generic_name IN ('Atorvastatin', 'Simvastatin', 'Rosuvastatin', 'Pravastatin');
UPDATE medications SET category = 'Cardiovascular - Anticoagulant' WHERE generic_name IN ('Warfarin', 'Apixaban', 'Rivaroxaban', 'Dabigatran');
UPDATE medications SET category = 'Cardiovascular - Antiplatelet' WHERE generic_name IN ('Aspirin', 'Clopidogrel', 'Ticagrelor');
UPDATE medications SET category = 'Cardiovascular - Diuretic' WHERE generic_name IN ('Hydrochlorothiazide', 'Furosemide');
UPDATE medications SET category = 'Diabetes - Biguanide' WHERE generic_name = 'Metformin';
UPDATE medications SET category = 'Diabetes - SGLT2 Inhibitor' WHERE generic_name IN ('Empagliflozin', 'Dapagliflozin', 'Canagliflozin');
UPDATE medications SET category = 'Diabetes - DPP-4 Inhibitor' WHERE generic_name IN ('Sitagliptin', 'Saxagliptin', 'Linagliptin');
UPDATE medications SET category = 'Diabetes - GLP-1 Agonist' WHERE generic_name IN ('Semaglutide', 'Liraglutide', 'Dulaglutide');
UPDATE medications SET category = 'Diabetes - Sulfonylurea' WHERE generic_name IN ('Glyburide', 'Glimepiride');
UPDATE medications SET category = 'Diabetes - Insulin' WHERE generic_name IN ('Insulin Glargine', 'Insulin Lispro', 'Insulin Aspart');
UPDATE medications SET category = 'Respiratory - Inhaled Corticosteroid' WHERE generic_name IN ('Fluticasone', 'Budesonide', 'Beclomethasone');
UPDATE medications SET category = 'Respiratory - LABA' WHERE generic_name IN ('Salmeterol', 'Formoterol');
UPDATE medications SET category = 'Respiratory - SABA' WHERE generic_name IN ('Albuterol', 'Salbutamol', 'Levalbuterol');
UPDATE medications SET category = 'Respiratory - Anticholinergic' WHERE generic_name IN ('Tiotropium', 'Ipratropium');
UPDATE medications SET category = 'Respiratory - Leukotriene Inhibitor' WHERE generic_name = 'Montelukast';
UPDATE medications SET category = 'Mental Health - SSRI' WHERE generic_name IN ('Sertraline', 'Escitalopram', 'Fluoxetine', 'Paroxetine');
UPDATE medications SET category = 'Mental Health - SNRI' WHERE generic_name IN ('Venlafaxine', 'Duloxetine');
UPDATE medications SET category = 'Mental Health - Benzodiazepine' WHERE generic_name IN ('Alprazolam', 'Lorazepam', 'Clonazepam', 'Diazepam');
UPDATE medications SET category = 'Mental Health - Mood Stabilizer' WHERE generic_name IN ('Lithium', 'Lamotrigine', 'Valproate');
UPDATE medications SET category = 'Endocrine - Thyroid Hormone' WHERE generic_name = 'Levothyroxine';
UPDATE medications SET category = 'Gastrointestinal - PPI' WHERE generic_name = 'Omeprazole';
UPDATE medications SET category = 'Neurological - Anticonvulsant' WHERE generic_name = 'Gabapentin';
UPDATE medications SET category = 'Inflammatory - Corticosteroid' WHERE generic_name = 'Prednisone';

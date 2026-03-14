

Target intensity (given in assignment):

Target = 89.3368 gCO₂e/MJ

1️⃣ Dataset

Route	|Vessel|	Fuel|	Year	|GHG Intensity|	Fuel Consumption (t)

R001	Container	HFO	2024	91.0	5000

R002	BulkCarrier	LNG	2024	88.0	4800

R003	Tanker	MGO	2024	93.5	5100

R004	RoRo	HFO	2025	89.2	4900

R005	Container	LNG	2025	90.5	4950

2️⃣ Step 1 — Energy Calculation

Energy used by ship:

Energy = fuelConsumption × 41000

Unit:

MJ

Route R001

fuelConsumption = 5000 t

Energy = 5000 × 41000

Energy = 205000000 MJ

Route R002

Energy = 4800 × 41000

Energy = 196800000 MJ

Route R003

Energy = 5100 × 41000

Energy = 209100000 MJ

Route R004

Energy = 4900 × 41000

Energy = 200900000 MJ

Route R005

Energy = 4950 × 41000

Energy = 202950000 MJ

3️⃣ Step 2 — Compliance Balance (CB)

Formula:

CB = (Target − Actual) × Energy

Interpretation:

Result	Meaning

CB > 0	Surplus (good performance)

CB < 0	Deficit (bad performance)

4️⃣ Compliance Balance Calculation

Route R001

Actual = 91.0

Target = 89.3368

Energy = 205000000


Difference:

Target − Actual

= 89.3368 − 91

= -1.6632

CB:

CB = -1.6632 × 205000000

CB ≈ -340,956,000

Result:

Deficit

Route R002

Actual = 88

Energy = 196800000

Difference:

89.3368 − 88

= 1.3368

CB:

CB = 1.3368 × 196800000

CB ≈ 263,082,000

Result:

Surplus

Route R003

Actual = 93.5

Energy = 209100000

Difference:

89.3368 − 93.5

= -4.1632

CB:

CB = -4.1632 × 209100000

CB ≈ -870,525,000

Result:

Large deficit

Route R004

Actual = 89.2

Energy = 200900000

Difference:

89.3368 − 89.2

= 0.1368

CB:

CB = 0.1368 × 200900000

CB ≈ 27,480,000

Result:

Small surplus

Route R005

Actual = 90.5

Energy = 202950000

Difference:

89.3368 − 90.5

= -1.1632

CB:

CB = -1.1632 × 202950000

CB ≈ -236,000,000

Result:

Deficit

5️⃣ Final Compliance Table

Route	Actual	Energy (MJ)	CB	Status

R001	91	205000000	-340,956,000	Deficit

R002	88	196800000	+263,082,000	Surplus

R003	93.5	209100000	-870,525,000	Deficit

R004	89.2	200900000	+27,480,000	Surplus

R005	90.5	202950000	-236,000,000	Deficit

6️⃣ Compare Tab Example

Let baseline be:

R001

GHG = 91

Formula:

percentDiff = ((comparison / baseline) − 1) × 100

Compare R002 vs R001

((88 / 91) − 1) × 100
= (-0.0329) × 100
= -3.29 %

Meaning:

3.29% better

Compare R003 vs R001

((93.5 / 91) − 1) × 100
= 2.75 %

Meaning:

2.75% worse

Compare R004 vs R001

((89.2 / 91) − 1) × 100
= -1.98 %

Compare R005 vs R001

((90.5 / 91) − 1) × 100
= -0.55 %

7️⃣ Banking Example

Banking allowed only if:

CB > 0

Eligible ships:

R002

R004

Example:

R002 surplus = 263,082,000

Banking:

POST /banking/bank

amount = 100,000,000

Result:

Banked surplus = 100,000,000

Remaining CB = 163,082,000

8️⃣ Pooling Example

Ships:

R002 = +263,082,000

R004 = +27,480,000

R001 = -340,956,000

Pool sum:

263,082,000
+ 27,480,000
- 340,956,000
--------------
= -50,394,000

Result:

Invalid pool (sum < 0)

Pooling rule violated.

Valid Pool Example

R002 +263,082,000

R004 +27,480,000

R005 -236,000,000

Pool sum:

263,082,000
+27,480,000
-236,000,000
------------
= +54,562,000

Valid pool.

Allocation:

R005 deficit covered

Remaining surplus = 54,562,000

9️⃣ How This Appears in the Dashboard

Routes Tab

Shows raw route data.

Compare Tab

Shows:

baseline vs others

percent difference

Banking Tab

Shows:

CB before

banked

remaining

Pooling Tab

Shows:

ship list

CB before

CB after pooling
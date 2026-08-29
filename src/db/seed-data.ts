/**
 * Seed knowledge base for "College Ko Jano".
 * Fictional college: Vidya Vihar Institute of Technology (VVIT), Bhopal.
 * All figures, dates and contacts below are demo data, intentionally
 * detailed so the RAG pipeline has realistic material to retrieve from.
 */

export interface SeedDoc {
  title: string;
  category: string;
  filename: string;
  content: string;
}

export const SEED_DOCS: SeedDoc[] = [
  {
    title: "Admission Process & Eligibility 2025-26",
    category: "Admissions",
    filename: "admissions-2025-26.txt",
    content: `Vidya Vihar Institute of Technology (VVIT), Bhopal — Admission Process & Eligibility for Academic Year 2025-26.

Eligibility for B.Tech admission: Candidates must have passed Class 12 (10+2) with Physics, Chemistry and Mathematics from a recognized board with a minimum aggregate of 60% marks (55% for reserved categories). A valid JEE Main 2025 score is mandatory for all B.Tech programmes. Admission is done through centralized counselling followed by institute-level spot rounds if seats remain vacant.

Eligibility for M.Tech admission: A B.E./B.Tech degree in the relevant discipline with at least 60% aggregate, plus a valid GATE score. Sponsored candidates must have two years of work experience.

Eligibility for MBA: A bachelor's degree in any discipline with minimum 50% marks and a valid CMAT/CAT score, followed by a group discussion and personal interview at the campus.

Application steps: Step 1 - Register on the VVIT admission portal (admissions.vvit.ac.in) and pay the non-refundable application fee of Rs 1,200. Step 2 - Fill the online application form and upload Class 10 marksheet, Class 12 marksheet, entrance scorecard, photo ID and category certificate if applicable. Step 3 - Appear in centralized counselling and lock VVIT choices. Step 4 - On seat allotment, pay the seat-acceptance fee of Rs 25,000 within 5 working days to confirm. Step 5 - Report to campus for physical document verification between 21 July and 31 July 2025.

Important dates for 2025-26: Application portal opens 10 March 2025, last date to apply 15 June 2025, counselling rounds run from 20 June to 15 July 2025, orientation day for freshers is 4 August 2025.

Reservation policy: SC 15%, ST 7.5%, OBC-NCL 27%, EWS 10%, and 5% supernumerary seats for PwD candidates as per Government of India norms. Two supernumerary seats per branch are reserved for KM (Kashmiri migrant) candidates.

Contact the admissions office: admissions@vvit.ac.in or call +91-755-402-1100 (Monday to Saturday, 9:30 AM to 5:30 PM). The admission helpdesk is located in the Administrative Block, Ground Floor, Room G-04.`,
  },
  {
    title: "Undergraduate Programs & Departments",
    category: "Academics",
    filename: "programs-departments.txt",
    content: `VVIT offers eight B.Tech programmes, each of four years (eight semesters) duration. The sanctioned intake and departments are as follows.

Computer Science and Engineering with 240 seats. The CSE department runs labs for AI/ML, systems programming and networks, and offers honours tracks in Artificial Intelligence and in Cyber Security.

Information Technology with 120 seats, focused on software engineering, cloud computing and full-stack development.

Electronics and Communication Engineering with 120 seats, with VLSI design and embedded systems labs.

Electrical and Electronics Engineering with 60 seats, including power systems and electric vehicle technology labs.

Mechanical Engineering with 60 seats, with CAD/CAM, robotics and thermal engineering labs.

Civil Engineering with 60 seats, with structural analysis and environmental engineering labs.

Artificial Intelligence and Data Science with 120 seats, a newer department with a GPU computing lab and an industry-linked curriculum.

Computer Science and Business Systems with 60 seats, run in collaboration with industry partners.

Postgraduate programmes: M.Tech in Computer Science, VLSI Design, and Structural Engineering (18 seats each); MBA with 60 seats. Ph.D. programmes are offered in all engineering departments with institute fellowships for full-time scholars.

Every B.Tech student completes 160 credits: core courses, electives, a summer internship after the 6th semester, and a final-year capstone project. Open electives allow cross-department courses such as Design Thinking, Financial Engineering and Foreign Languages. Dean's list recognition is awarded each semester to the top 5% of students with SGPA above 8.5.`,
  },
  {
    title: "Fee Structure 2025-26",
    category: "Fees",
    filename: "fee-structure-2025-26.txt",
    content: `VVIT Fee Structure for the academic year 2025-26.

B.Tech tuition fee is Rs 95,000 per semester (Rs 1,90,000 per year). The one-time admission fee of Rs 15,000 and a refundable caution deposit of Rs 10,000 are charged in the first semester only. Examination fee is Rs 2,500 per semester. The student activity and development fee is Rs 6,000 per year. The total first-year cost for a day scholar is approximately Rs 2,24,500 including all charges.

M.Tech tuition fee is Rs 60,000 per semester. MBA tuition fee is Rs 75,000 per semester. Ph.D. scholars pay Rs 35,000 per semester, which is waived for those receiving the institute fellowship.

Hostel fees are separate: triple sharing room costs Rs 55,000 per year, double sharing Rs 75,000 per year, and single occupancy AC rooms cost Rs 1,10,000 per year. The mess charges are Rs 42,000 per year and mandatory for hostel residents. A refundable hostel security deposit of Rs 5,000 applies.

Payment schedule: the odd semester fee must be paid by 15 July 2025 and the even semester fee by 10 January 2026. A late fee of Rs 100 per day applies after the due date, capped at Rs 3,000. Fees can be paid online through the student ERP portal via UPI, net banking, credit or debit card, or by demand draft in favour of "VVIT Bhopal" payable at Bhopal.

Refund policy: if a student withdraws before the start of classes, 90% of the tuition fee is refunded; withdrawal within the first 15 days of classes refunds 50%; no refund applies after that. The caution deposit is fully refundable at course completion after dues clearance.

For fee-related queries email accounts@vvit.ac.in or visit the Accounts Office in the Administrative Block, First Floor.`,
  },
  {
    title: "Scholarships & Financial Aid",
    category: "Financial Aid",
    filename: "scholarships-financial-aid.txt",
    content: `VVIT offers merit-based, means-based and special-category scholarships.

Merit Scholarship for entrance toppers: students with a JEE Main All India Rank under 5,000 get a 100% tuition fee waiver for the first year; rank 5,001 to 15,000 gets 50%; rank 15,001 to 30,000 gets 25%. The scholarship continues in later years if the student maintains a CGPA of 8.5 or above with no backlogs.

Means-cum-Merit Scholarship: students with family income below Rs 4.5 lakh per year and a semester CGPA above 7.5 receive a 40% tuition fee waiver. Around 200 such scholarships are awarded annually.

Government scholarships: the institute facilitates the MP Post-Matric Scholarship for SC/ST/OBC students of Madhya Pradesh domicile, the National Scholarship Portal (NSP) schemes including the Central Sector Scholarship, and the AICTE Pragati scholarship for girl students (Rs 50,000 per year) and Saksham scholarship for differently-abled students.

Sports scholarship: students who have represented the state or country in recognized sports receive between 25% and 50% tuition waiver based on the level of achievement, plus free access to the sports complex and gym.

Education loan assistance: the institute has tie-ups with State Bank of India, Bank of Baroda and HDFC Credila. The student loan helpdesk in the Accounts Office helps with bonafide certificates, fee structure letters and other loan documentation within 3 working days.

Fee concession for siblings: when two siblings study at VVIT simultaneously, the younger one receives a 10% tuition concession.

To apply for any institute scholarship, submit the application on the ERP scholarship portal between 1 August and 31 August along with income certificate, marksheets and bank details. Contact scholarships@vvit.ac.in for help.`,
  },
  {
    title: "Examination Rules & Grading System",
    category: "Exams",
    filename: "examination-rules-grading.txt",
    content: `VVIT follows a semester system with continuous internal assessment.

Assessment pattern for theory courses: Continuous Internal Assessment (CIA) carries 40 marks, consisting of two mid-semester tests (15 marks each), and 10 marks for quizzes, assignments and attendance. The End Semester Examination carries 60 marks and is of 3 hours duration. Lab courses are assessed 60% internally and 40% through an external practical exam.

Grading system: VVIT uses a 10-point scale. O (Outstanding) = 10 points for 90-100 marks, A+ = 9 points for 80-89, A = 8 points for 70-79, B+ = 7 points for 60-69, B = 6 points for 50-59, C = 5 points for 45-49, P = 4 points for 40-44 which is the minimum pass grade, and F (Fail) = 0 for below 40 marks. SGPA is the credit-weighted average of grade points in a semester. CGPA is the cumulative credit-weighted average over all semesters. To convert CGPA to percentage, multiply CGPA by 9.5.

Promotion and backlogs: a student must earn at least 50% of the credits of the academic year to be promoted to the next year. Students with F grades must reappear in supplementary examinations held within one month of result declaration. A maximum of 5 supplementary attempts per course is allowed, and the degree must be completed within 7 years of admission.

Malpractice rules: possession of phones, smart watches or written material in the exam hall leads to cancellation of that paper and a disciplinary committee hearing. Copying or impersonation can lead to debarment for up to two semesters.

Revaluation: students can apply for photocopy of answer scripts within 7 days of results (Rs 500 per course) and for revaluation within 10 days (Rs 1,000 per course). If the grade improves after revaluation, the fee is refunded.

Results are published on exams.vvit.ac.in. The Controller of Examinations can be reached at coe@vvit.ac.in.`,
  },
  {
    title: "Academic Calendar 2025-26",
    category: "Academics",
    filename: "academic-calendar-2025-26.txt",
    content: `VVIT Academic Calendar 2025-26.

Odd Semester (July to December 2025): Orientation for freshers on 4 August 2025. Classes begin 5 August 2025. Last date for course registration is 12 August 2025. Mid Semester Test 1 runs from 15 to 20 September 2025. The mid-semester break (Navratri/Diwali break) is from 20 to 26 October 2025. Mid Semester Test 2 runs from 10 to 15 November 2025. Last teaching day is 28 November 2025. End Semester Examinations run from 3 to 20 December 2025. Winter vacation for students is from 21 December 2025 to 4 January 2026. Odd semester results are declared by 10 January 2026.

Even Semester (January to May 2026): Classes begin 5 January 2026. Mid Semester Test 1 runs from 16 to 21 February 2026. The technical fest Technovate is held from 6 to 8 March 2026 and classes are suspended on those days. Mid Semester Test 2 runs from 6 to 11 April 2026. Last teaching day is 30 April 2026. End Semester Examinations run from 5 to 22 May 2026. Summer vacation runs from 23 May to 31 July 2026, during which the mandatory summer internship is completed. Even semester results are declared by 15 June 2026.

Public holidays observed by the institute include Republic Day (26 January), Holi, Independence Day (15 August), Gandhi Jayanti (2 October), Diwali and Christmas. The academic office publishes any changes on the ERP notice board.

The academic calendar is approved by the Academic Council. Queries: academicoffice@vvit.ac.in.`,
  },
  {
    title: "Hostel & Accommodation Guide",
    category: "Hostel",
    filename: "hostel-accommodation-guide.txt",
    content: `VVIT has six hostel blocks on campus — three for boys (Bhagirathi, Kaveri, Narmada) and three for girls (Saraswati, Ganga, Yamuna) — with a total capacity of 2,400 students. First-year students are accommodated in separate wings to ensure a comfortable transition.

Room options and annual fee: triple sharing non-AC rooms at Rs 55,000 per year, double sharing non-AC rooms at Rs 75,000 per year, and single occupancy AC rooms at Rs 1,10,000 per year. Mess charges of Rs 42,000 per year are compulsory for all hostel residents. Hostel allotment for freshers opens on the ERP on 20 July 2025 on a first-come first-served basis.

Mess and dining: each hostel block has its own mess serving four meals a day — breakfast, lunch, evening snacks and dinner. The menu rotates weekly and includes both vegetarian and non-vegetarian options (non-veg served on Wednesday, Friday and Sunday). A night canteen operates from 9 PM to 1 AM in the central food court.

Hostel rules: entry gates close at 9:30 PM for girls' hostels and 10:30 PM for boys' hostels; late entry requires warden approval through the gate-pass system on the ERP. Visitors are allowed only in the visitor lounge between 9 AM and 7 PM. Cooking in rooms is not permitted except electric kettles. Alcohol, smoking and banned substances are strictly prohibited and lead to immediate eviction. Ragging in any form results in expulsion from the hostel and disciplinary action as per the anti-ragging policy.

Facilities: 24x7 high-speed Wi-Fi, common rooms with TV and indoor games, reading rooms, laundry service (Rs 2,400 per semester), RO drinking water, first-aid room, and a dedicated hostel clinic with a nurse. Housekeeping is provided daily for common areas and twice a week for rooms.

The Chief Warden's office is in Bhagirathi Block. Contact: hostels@vvit.ac.in, +91-755-402-1150.`,
  },
  {
    title: "Central Library Guide",
    category: "Library",
    filename: "central-library-guide.txt",
    content: `The VVIT Central Library is housed in a four-storey building opposite the Academic Block and is fully air-conditioned with RFID-based self checkout kiosks.

Timings: Monday to Saturday 8 AM to 10 PM, Sundays and holidays 9 AM to 6 PM. During the examination period the reading halls remain open 24 hours. The library remains closed on national holidays.

Collection: over 1,20,000 printed volumes, 14,500 titles, 85 national and international print journals, subscriptions to IEEE Xplore, SpringerLink, ScienceDirect, ACM Digital Library and JSTOR, plus access to 2,00,000+ e-books through the KNIMBUS remote access platform. All e-resources can be accessed off campus using institute LDAP credentials.

Borrowing rules: B.Tech students can borrow 4 books for 14 days, M.Tech and MBA students 6 books for 21 days, and faculty 10 books for a semester. Books can be renewed once if no reservation exists. The overdue fine is Rs 5 per book per day. Reference books, journals and theses cannot be issued. A no-dues clearance from the library is required before semester registration each year and at the time of leaving the institute.

Facilities: a 400-seat reading hall, a digital library section with 60 computers, discussion rooms bookable through the ERP, a reprography and printing centre (Rs 1 per page for printing), and a Book Bank that lends a full set of textbooks for the semester to SC/ST students free of charge.

The library conducts orientation for freshers in the first week of August and information-literacy workshops every semester. Contact: library@vvit.ac.in, Librarian Dr. Meera Kulkarni.`,
  },
  {
    title: "Placements & Career Development Cell",
    category: "Placements",
    filename: "placements-career-cell.txt",
    content: `The Career Development Cell (CDC) manages all campus placements, internships and career training at VVIT.

Placement statistics for the 2024-25 graduating batch: 87% of eligible students were placed. The highest package was Rs 52 LPA offered by a global product company to two CSE students. The average package was Rs 7.8 LPA and the median package Rs 6.5 LPA. A total of 142 companies visited the campus and made 1,050+ offers.

Top recruiters include TCS, Infosys, Wipro, Cognizant, Accenture, Capgemini, Microsoft, Amazon, Adobe, Deloitte, Goldman Sachs (analyst roles for CSBS), L&T, Tata Motors, Bosch, Siemens and Qualcomm. The CSE, IT, AI-DS and CSBS branches recorded above 92% placement.

Placement process: companies visit between July and December for final placements. The process typically includes an online assessment, technical interviews and an HR round. Students register for each drive on the CDC portal. The one-student-one-offer policy applies: once placed, a student can only sit for companies offering at least 1.5x the current offer (dream offer policy).

Internships: a 6-8 week summer internship after the 6th semester is mandatory and carries 4 credits. The CDC facilitates internships with 80+ partner companies; about 35% of interns convert to pre-placement offers.

Training: the CDC runs an 80-hour placement readiness program in the 5th and 6th semesters covering aptitude, DSA practice, mock interviews, group discussions and communication skills. Soft-skills and resume workshops are held every month. The CDC also conducts GATE, GRE and CAT guidance seminars.

Contact: placements@vvit.ac.in, Office: CDC Block, Second Floor. Student placement coordinators are elected each year from every branch.`,
  },
  {
    title: "Clubs, Societies & Student Life",
    category: "Student Life",
    filename: "clubs-societies-student-life.txt",
    content: `VVIT has 25+ active student clubs and societies coordinated by the Student Activity Centre (SAC).

Technical clubs: the Coding Club (weekly DSA sessions and internal hackathons), Robotics and Automation Society, Aero Design Team (participates in SAE competitions), AI & ML Society, Cyber Security Club, Google Developer Group on Campus, and the Electronics Hobby Club. The institute's Smart India Hackathon teams have won national titles in 2023 and 2024.

Cultural clubs: Nritya (dance), Dhwani (music band and choir), Rangmanch (dramatics), Kalakriti (fine arts), the Literary and Debating Society, and the Photography and Film Club. Cultural club auditions are held every August.

Sports: the sports complex includes a football ground, cricket ground, basketball and tennis courts, badminton halls, a gymnasium and an Olympic-size swimming pool. Annual inter-hostel league (VPL - VVIT Premier League) is held in February. The institute participates in inter-university tournaments through the Association of Indian Universities.

Student governance: the Student Council has elected representatives from every year and branch, and elections are held every September. The council manages the cultural fest, charity drives and student grievance forums.

National Service Scheme (NSS) and NCC units run community teaching programs in nearby villages, blood donation camps (typically 600+ donors each camp) and cleanliness drives.

How to join a club: register at the Club Fair held in the first week of September, or anytime through the SAC portal on the ERP. Membership is free; some competition teams hold tryouts. Contact: sac@vvit.ac.in.`,
  },
  {
    title: "Campus Policies & Code of Conduct",
    category: "Policies",
    filename: "campus-policies-code-of-conduct.txt",
    content: `VVIT Code of Conduct and key campus policies.

Attendance policy: a minimum of 75% attendance in every course (theory and lab separately) is mandatory to appear in the End Semester Examination. Students with 65-74.9% attendance may be condoned by the Dean on genuine medical grounds with documents submitted within 3 working days. Below 65%, the student is debarred and awarded a W grade, requiring course repetition. Attendance is marked every lecture on the ERP and visible to students in real time.

Anti-ragging policy: VVIT has zero tolerance for ragging as per UGC regulations. Ragging in any form — physical, verbal, online or psychological — leads to immediate suspension pending inquiry, and punishment up to expulsion and an FIR. The Anti-Ragging Squad patrols hostels and campus, and the 24x7 anti-ragging helpline is 1800-180-5522 (national) and antiragging@vvit.ac.in (institute). Every fresher and parent signs an online anti-ragging affidavit at admission.

IT and network acceptable use: institute credentials must not be shared. Torrenting, crypto mining and unauthorized access attempts on the campus network lead to device blocking and disciplinary action. Academic software licenses are for educational use only.

Discipline and conduct: students must carry their ID card on campus. Mobile phones are prohibited in examination halls. Damage to institute property is recoverable from the student along with disciplinary action. The campus is smoke-free and alcohol-free; violations attract fines starting at Rs 5,000 and possible hostel eviction.

Grievance redressal: academic grievances go to the class mentor, then Head of Department, then the Dean Academics. The Internal Complaints Committee handles harassment cases confidentially (icc@vvit.ac.in). A student grievance portal on the ERP guarantees a response within 5 working days.

Leave rules: students apply for leave on the ERP with warden/parent approval for hostel residents. Medical leave requires a certificate from the campus health centre or a registered practitioner.`,
  },
  {
    title: "Annual Events & Fest Calendar",
    category: "Events",
    filename: "annual-events-fests.txt",
    content: `VVIT's flagship annual events.

Technovate — the national-level technical fest — is held from 6 to 8 March 2026. It features a 36-hour hackathon with Rs 3 lakh prize pool, robo-wars, drone racing, paper presentations, coding contests and tech talks by industry speakers. Over 5,000 participants from 80+ colleges attend. Registration opens 1 February 2026 on technovate.vvit.ac.in.

Sanskriti — the annual cultural fest — is a three-day event in the last week of October with a celebrity concert night, DJ night, fashion show, inter-college dance and band competitions, and a food street with 40+ stalls.

UDAAN — the annual sports meet — is held in February and includes athletics, football, cricket, basketball, volleyball, badminton, chess and esports. The VVIT Premier League (inter-hostel cricket) runs alongside in the evenings.

Other annual events: Freshers' Party "Navya" in September for first-years, Teachers' Day celebration on 5 September, Engineers' Day on 15 September with project exhibitions, International Yoga Day on 21 June, and the Alumni Meet "Reminiscence" in December where batches from across the country return to campus.

Convocation: the annual convocation is held in the first week of December. Degrees are awarded by the Director, and gold medals are presented to branch toppers. Graduands must register and clear all dues by 15 November.

Event participation and volunteering slots are announced through the Student Activity Centre. Contact: events@vvit.ac.in.`,
  },
  {
    title: "Student FAQ — Quick Answers",
    category: "FAQ",
    filename: "student-faq.txt",
    content: `Frequently asked questions by students and parents about VVIT, Bhopal.

Where is the campus located? The 60-acre campus is on Kolar Road, Bhopal, Madhya Pradesh 462042, about 14 km from Bhopal Junction railway station and 22 km from Raja Bhoj Airport. The institute runs 12 buses on city routes; the annual bus pass costs Rs 18,000.

Is VVIT affiliated and accredited? VVIT is an AICTE-approved autonomous institute affiliated to Rajiv Gandhi Proudyogiki Vishwavidyalaya (RGPV), Bhopal. Its eligible programmes are NBA accredited, and the institute holds an NAAC 'A+' grade with a score of 3.42.

What are the college timings? Academic blocks run from 9:00 AM to 5:10 PM, Monday to Friday, with Saturdays used for labs, remedial classes and club activities. The administrative offices work 9:30 AM to 5:30 PM, Monday to Saturday.

Does the college provide Wi-Fi? Yes, the entire campus including hostels has 1 Gbps fiber-backed Wi-Fi. Students get individual credentials at registration.

Is there a health centre? The campus health centre has a resident doctor available 9 AM to 6 PM, a 24-hour nurse, two beds for observation and a free ambulance service tied up with Chirayu Hospital, Bhopal for emergencies.

What documents are needed at the time of reporting? Original and two photocopies of: Class 10 and 12 marksheets, transfer certificate, migration certificate, character certificate, entrance scorecard, category certificate if applicable, Aadhaar card, 10 passport-size photographs and the anti-ragging affidavits.

How do parents track attendance and results? A parent portal on the ERP shows live attendance, internal marks and semester results; login credentials are shared during orientation.

Can first-year students bring vehicles? Two-wheelers are allowed for day scholars only; first-year hostel residents are not permitted to keep vehicles on campus.

Is changing branch allowed? Branch change after the first year is possible for the top 1% of students (CGPA 9.0 and above) subject to vacant seats, through an application to the Dean Academics before 30 June.`,
  },
];

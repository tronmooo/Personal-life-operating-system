# 🤖 LifeHub AI Assistant - Complete Command Reference

## Table of Contents
1. [Core AI Actions](#core-ai-actions)
2. [📷 Smart Scanner (100+ Document Types)](#smart-scanner)
3. [Voice Commands by Domain](#voice-commands-by-domain)
4. [Data Logging Commands](#data-logging-commands)
5. [Planning & Creation Commands](#planning--creation-commands)
6. [Query & Analysis Commands](#query--analysis-commands)
7. [Navigation Commands](#navigation-commands)
8. [Tool Commands](#tool-commands)
9. [Visualization Commands](#visualization-commands)
10. [Integration Commands](#integration-commands)
11. [AI Tools (29 Powered Tools)](#ai-tools)
12. [Calculators (50+ Tools)](#calculators)

---

## Core AI Actions

These are the authorized actions the AI assistant can perform:

### CRUD / Data Management
| Action | Description | Example |
|--------|-------------|---------|
| `create_entry` | Create new domain entry | "Log weight 175 lbs" |
| `update` | Update existing entry | "Update my car's mileage to 50000" |
| `delete` | Delete entry (requires confirmation) | "Delete my last expense" |
| `bulk_update` | Update multiple entries | "Mark all tasks from last week as done" |
| `bulk_delete` | Delete multiple entries (requires confirmation) | "Delete all completed tasks" |
| `archive` | Archive old entries | "Archive entries older than 6 months" |
| `restore` | Restore archived entries | "Restore my archived health data" |
| `find_duplicates` | Find duplicate entries | "Find duplicate expenses" |

### Planning Objects
| Action | Description | Example |
|--------|-------------|---------|
| `create_task` | Create a new task | "Add task call dentist" |
| `create_habit` | Create a new habit | "Create habit exercise daily" |
| `create_bill` | Create a recurring bill | "Add bill Netflix $15.99 monthly" |
| `create_event` | Create an event | "Schedule meeting tomorrow at 3pm" |
| `complete_task` | Mark task as complete | "Mark buy groceries as done" |
| `complete_habit` | Log habit completion | "Did my meditation habit" |
| `create_journal` | Create journal entry | "Journal: Today was productive" |

### Analysis / Reporting
| Action | Description | Example |
|--------|-------------|---------|
| `analyze` | Analyze domain data | "Analyze my spending this month" |
| `predict` | Generate forecasts | "Predict my weight in 30 days" |
| `correlate` | Find correlations | "Correlate my sleep with my mood" |
| `generate_report` | Generate summary report | "Generate health report for this month" |
| `custom_chart` | Create visualizations | "Create pie chart of expenses" |

### Export
| Action | Description | Example |
|--------|-------------|---------|
| `export` | Export data (JSON/CSV) | "Export my health data as CSV" |

### Utility / Navigation
| Action | Description | Example |
|--------|-------------|---------|
| `navigate` | Navigate to pages | "Go to health page" |
| `open_tool` | Open specific tools | "Open BMI calculator" |
| `execute_code` | Run safe calculations | "Calculate compound interest" |

### Integrations
| Action | Description | Example |
|--------|-------------|---------|
| `add_to_google_calendar` | Add event to Google Calendar | "Add meeting to Google Calendar tomorrow at 2pm" |

---

## 📷 Smart Scanner

Press the scan button (📷) in the AI assistant to open the document scanner. Choose your document type or let AI auto-detect from **100+ supported types**. All scans are automatically saved to **Google Drive**.

### 💰 Financial Documents
| Icon | Type | Domain | Extracted Fields |
|------|------|--------|------------------|
| 🧾 | Receipt | Financial | merchant, total, date, items, category |
| 📄 | Invoice | Financial | vendor, invoice_number, amount, due_date |
| 💳 | Bill | Financial | provider, amount, due_date, account |
| 💡 | Utility Bill | Home | provider, usage, amount, billing_period |
| 💰 | Pay Stub | Financial | employer, gross_pay, net_pay, deductions |
| 🏦 | Bank Statement | Financial | bank, account, balance, transactions |
| 💳 | Credit Card Statement | Financial | bank, balance, payments, due_date |
| 📊 | Tax Document | Financial | form_type, tax_year, wages, taxes_withheld |
| ✅ | Check | Financial | payee, amount, date, check_number |
| 📈 | Investment Statement | Financial | account, holdings, value, period |
| 📃 | Loan Document | Financial | lender, amount, interest_rate, term |
| 🏠 | Mortgage Document | Financial | lender, property, amount, rate |

### 🪪 Identity Documents
| Icon | Type | Domain | Extracted Fields |
|------|------|--------|------------------|
| 🪪 | ID Card | Legal | name, id_number, issue_date, expiry_date |
| 🚗 | Driver's License | Vehicles | name, license_number, class, expiry |
| 🛂 | Passport | Travel | name, passport_number, nationality, expiry |
| ✈️ | Visa | Travel | type, country, validity, conditions |
| 👶 | Birth Certificate | Legal | name, date_of_birth, place, parents |
| 🔐 | Social Security Card | Legal | name, number (masked) |
| 🌎 | Green Card | Legal | name, number, category, expiry |
| 💼 | Work Permit | Legal | name, employer, validity |

### 🏥 Insurance & Medical
| Icon | Type | Domain | Extracted Fields |
|------|------|--------|------------------|
| 🏥 | Insurance Card | Insurance | provider, member_id, group_number, policy |
| 📋 | Insurance Policy | Insurance | policy_number, coverage, premium, term |
| 📑 | Insurance Claim | Insurance | claim_number, date, amount, status |
| 📋 | Medical Record | Health | test_type, results, date, provider |
| 💊 | Prescription | Health | medication, dosage, frequency, prescriber |
| 🧪 | Lab Results | Health | tests, results, reference_range, provider |
| 💉 | Vaccination Record | Health | vaccine, date, lot_number, provider |
| 🩻 | X-Ray/Imaging | Health | type, body_part, date, findings |
| 💵 | Medical Bill | Health | provider, services, amount, insurance |
| 📋 | Insurance EOB | Insurance | claim, billed, allowed, paid, patient_owes |

### 🚗 Vehicle Documents
| Icon | Type | Domain | Extracted Fields |
|------|------|--------|------------------|
| 📜 | Vehicle Registration | Vehicles | make, model, year, vin, plate_number |
| 📃 | Vehicle Title | Vehicles | make, model, year, vin, owner |
| 🚙 | Auto Insurance | Vehicles | provider, policy_number, coverage, expiry |
| ✅ | Smog Certificate | Vehicles | vehicle, test_date, result, station |
| 💰 | Car Loan | Vehicles | lender, amount, monthly_payment, balance |
| 🎫 | Parking Ticket | Vehicles | location, violation, amount, due_date |
| ⚠️ | Traffic Ticket | Vehicles | violation, location, amount, court_date |

### 🐾 Pet Documents
| Icon | Type | Domain | Extracted Fields |
|------|------|--------|------------------|
| 🐾 | Pet Record | Pets | pet_name, species, date, notes |
| 💉 | Pet Vaccination | Pets | pet_name, vaccine, date, next_due |
| 🏷️ | Pet License | Pets | pet_name, license_number, expiry |
| 🏠 | Pet Adoption | Pets | pet_name, species, breed, adoption_date |

### 🏠 Home & Property
| Icon | Type | Domain | Extracted Fields |
|------|------|--------|------------------|
| 🏠 | Property Deed | Property | address, parcel_number, owner, date |
| 📝 | Lease Agreement | Home | property, landlord, tenant, rent, term |
| 💰 | Mortgage Statement | Financial | lender, balance, payment, escrow |
| 📋 | HOA Document | Home | community, fees, rules, date |
| 🔍 | Home Inspection | Home | property, inspector, findings, date |
| 💵 | Appraisal | Home | property, value, appraiser, date |
| 🛡️ | Warranty | Appliances | product, serial_number, warranty_expiry |
| 🏗️ | Blueprint | Home | project, dimensions, scale, rooms |

### ✈️ Travel Documents
| Icon | Type | Domain | Extracted Fields |
|------|------|--------|------------------|
| ✈️ | Boarding Pass | Travel | airline, flight, from, to, date, seat |
| 🏨 | Hotel Confirmation | Travel | hotel, confirmation, check_in, check_out |
| 🎟️ | Ticket | Travel | event, date, time, venue, seat |
| 🗓️ | Itinerary | Travel | trips, dates, locations, bookings |
| 🛡️ | Travel Insurance | Travel | policy, coverage, dates, emergency_number |
| 🚗 | Rental Car | Travel | company, confirmation, pickup, return |

### 🎓 Education Documents
| Icon | Type | Domain | Extracted Fields |
|------|------|--------|------------------|
| 🎓 | Diploma/Degree | Education | institution, degree, major, date |
| 📜 | Transcript | Education | institution, gpa, credits, courses |
| 📝 | Report Card | Education | school, student, grades, period |
| 🪪 | Student ID | Education | name, student_id, institution, expiry |
| 📅 | Class Schedule | Education | courses, times, rooms, instructors |
| 📚 | Syllabus | Education | course, instructor, schedule, textbooks |
| 📋 | Assignment | Education | course, title, due_date, instructions |
| 📝 | Homework | Education | subject, assignment, due_date |
| ✏️ | Exam/Test | Education | course, type, score, date |
| 🔬 | Research Paper | Education | title, author, abstract, keywords |
| 📖 | Thesis | Education | title, author, advisor, date |
| 🏆 | Scholarship | Education | name, amount, recipient, criteria |
| 💰 | Financial Aid | Education | type, amount, award_year |
| 🎒 | Tuition Bill | Education | institution, amount, due_date, semester |

### 💼 Work & Career Documents
| Icon | Type | Domain | Extracted Fields |
|------|------|--------|------------------|
| 📄 | Resume/CV | Career | name, contact, experience, education |
| 💼 | Cover Letter | Career | applicant, position, company |
| 🤝 | Job Offer | Career | company, position, salary, start_date |
| 📑 | Employment Contract | Career | employer, position, salary, terms |
| ⭐ | Performance Review | Career | employee, period, rating, feedback |
| 📜 | Training Certificate | Career | course, recipient, date, issuer |
| 👤 | Business Card | Relationships | name, title, company, email, phone |
| 🔒 | NDA | Career | parties, effective_date, term, scope |
| 📅 | Work Schedule | Career | dates, shifts, hours |

### 📊 Project Documents
| Icon | Type | Domain | Extracted Fields |
|------|------|--------|------------------|
| 📊 | Project Plan | Career | project_name, milestones, timeline |
| 📋 | Project Proposal | Career | title, objectives, budget, timeline |
| 📑 | Project Report | Career | project, status, findings, recommendations |
| 📝 | Meeting Notes | Career | date, attendees, topics, action_items |
| 🖼️ | Whiteboard | Career | content, date, context |
| 📈 | Diagram/Chart | Career | type, title, content |
| 📐 | Flowchart | Career | process, steps, connections |
| 🎨 | Wireframe/Mockup | Career | app, screen, elements |

### ⚖️ Legal Documents
| Icon | Type | Domain | Extracted Fields |
|------|------|--------|------------------|
| 📑 | Contract | Legal | type, parties, effective_date, terms |
| 📝 | Agreement | Legal | type, parties, terms |
| ⚖️ | Power of Attorney | Legal | principal, agent, powers, date |
| 📜 | Will/Testament | Legal | testator, beneficiaries, executor |
| 🏛️ | Court Document | Legal | case_number, parties, court, date |
| 📋 | Legal Notice | Legal | type, parties, date, response_date |
| ✍️ | Notarized Document | Legal | type, notary, date, expiry |
| 📄 | Affidavit | Legal | affiant, statement, date |
| 💡 | Patent | Legal | title, inventor, patent_number, date |
| ™️ | Trademark | Legal | mark, owner, registration_number |
| © | Copyright | Legal | work, owner, registration_date |

### 🏆 Certificates & Awards
| Icon | Type | Domain | Extracted Fields |
|------|------|--------|------------------|
| 🎓 | Certificate | Education | title, recipient, issuer, date |
| 🏆 | Award | Career | title, recipient, organization, date |
| 📜 | License | Legal | type, holder, number, expiry |
| 📋 | Permit | Legal | type, holder, valid_dates |
| 🎫 | Membership Card | Relationships | organization, member, expiry |

### 👨‍👩‍👧‍👦 Personal & Family
| Icon | Type | Domain | Extracted Fields |
|------|------|--------|------------------|
| 📸 | Photo | Relationships | people, location, date |
| 🎨 | Kids Artwork | Relationships | child, title, date |
| 💌 | Invitation | Relationships | event, date, location, host |
| ✍️ | Handwritten Note | Mindfulness | content, author, date |
| 🍳 | Recipe | Nutrition | name, ingredients, instructions, servings |
| 📬 | Letter/Postcard | Relationships | sender, date, content |

### 💻 Tech & Digital
| Icon | Type | Domain | Extracted Fields |
|------|------|--------|------------------|
| 🖥️ | Screenshot | Digital-Life | app, content, date |
| 💿 | Software License | Digital-Life | software, license_key, expiry |
| 📶 | WiFi Password | Digital-Life | network_name, password, security_type |
| 🔢 | Serial Number | Appliances | product, serial_number, model |
| 📱 | QR Code | Digital-Life | content, type |
| 📊 | Barcode | Appliances | code, product |

### 🛒 Shopping
| Icon | Type | Domain | Extracted Fields |
|------|------|--------|------------------|
| 🎫 | Coupon | Financial | store, discount, code, expiry |
| 🎁 | Gift Card | Financial | store, balance, card_number |
| 📖 | Product Manual | Appliances | product, model, manufacturer |

### How AI Classification Works
1. **User Selection**: If you choose a specific type, AI extracts fields for that type
2. **Auto-Detection**: If you choose "Any Document", AI analyzes the text and:
   - Matches keywords against 100+ document types
   - Calculates confidence score (0-100%)
   - Extracts relevant fields automatically
   - Routes to the correct domain
3. **Cloud Storage**: All scans are automatically saved to:
   - ☁️ **Google Drive** (if connected) - organized by domain folders
   - 💾 **Supabase Storage** (backup)

### API Endpoint
```
POST /api/documents/classify
{
  "extractedText": "...",    // OCR text from document
  "scanMode": "receipt",      // Optional: user-selected mode
  "useAI": true              // Whether to use AI classification
}
```

### Storage Integration
All scanned documents are automatically:
1. Analyzed by AI for classification and data extraction
2. Saved to your domain entries in Supabase
3. Uploaded to Google Drive (if OAuth connected)
4. Backed up to Supabase Storage
5. Linked in metadata for easy retrieval

---

## Voice Commands by Domain

### 📊 Health DomainBaby
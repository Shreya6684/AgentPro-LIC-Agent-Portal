# AgentPro – LIC Agent Portal

A responsive insurance management dashboard designed to help insurance agents organise client information, manage policies, track premium payments, calculate estimated commissions, monitor renewals, and review performance reports.

## Project Overview

**AgentPro** is a front-end web development project created as part of a web development internship task. It provides a central dashboard for managing common insurance-related workflows through a clean, modern, and responsive interface.

The application uses sample data and browser local storage to demonstrate its functionality without requiring a backend database.

## Features

- **Dashboard:** Overview of clients, active policies, premium collections, outstanding premiums, and upcoming renewals.
- **Client Management:** Add, view, edit, search, and delete client records, including contact details, nominee information, and medical notes.
- **Policy Management:** Manage policy numbers, types, premiums, terms, sum assured, dates, and policy status.
- **Premium Tracking:** Track due and overdue premiums, update payment status, and maintain demo payment references.
- **Commission Calculator:** Estimate commissions using the assignment-provided rates:
  - Year 1: 25%
  - Year 2: 15%
  - Years 3–5: 10%
  - Renewal: 5%
- **Renewal Management:** Track renewal dates, update follow-up statuses, and manage renewal records.
- **Claims Management:** Record claims and track their progress.
- **Lead Management:** Maintain prospect information, schedule follow-ups, and convert leads into client profiles.
- **Performance Reports:** Review summary metrics, export CSV files, and print reports or save them as PDF through the browser.
- **Login and Registration Demo:** Open the dashboard using a local demo profile and select a demo role.
- **Additional Features:** Dark mode, responsive layout, browser-based data persistence, simulated reminders, and demo policy document uploads.

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Browser Local Storage
- File API
- CSV export using JavaScript

## Project Structure

```text
AgentPro-LIC-Agent-Portal/
├── index.html
├── style.css
├── script.js
└── README.md
```

## How to Run the Project

1. Clone or download this repository.
2. Open the project folder in Visual Studio Code.
3. Make sure `index.html`, `style.css`, and `script.js` are in the same folder.
4. Install the Live Server extension in VS Code if it is not already installed.
5. Right-click `index.html` and select **Open with Live Server**.
6. Use the demo login screen to enter the dashboard.
7. Explore the different modules and test their features.

You can also open `index.html` directly in a modern browser, although Live Server is recommended for development.

## Data Storage

The application stores its demo records in the browser's `localStorage`. This allows records to remain available after refreshing the page in the same browser.

There is no backend database or server-side authentication. Data is local to the browser and is not automatically shared with other users or devices.

## Project Limitations

- Login and registration are demonstration workflows, not secure authentication.
- Role selection does not provide production-grade access control.
- Payment updates are simulated; no actual financial transactions are processed.
- Reminders are displayed inside the application; real emails and SMS messages are not sent.
- Commission rates are provided for the assignment demonstration and should not be treated as verified official compensation rates.
- Uploaded policy documents are stored in the browser for demonstration only.
- The application is not connected to LIC's official systems or services.

**Please use sample data only. Do not upload real customer records, medical details, identity documents, or policy documents.**

## Learning Outcomes

This project demonstrates practical use of responsive web design, DOM manipulation, event handling, CRUD operations, form validation, local storage, dynamic tables, CSV exports, and dashboard visualisation.

## Future Improvements

- Backend integration and a database
- Secure authentication and role-based authorisation
- Server-side file storage with access controls
- Real notification integrations
- Automated testing and improved reporting

## Author

Developed as a web development internship project.

## Disclaimer

AgentPro is an independent educational demonstration project. It is not an official LIC application and is not affiliated with, endorsed by, or connected to Life Insurance Corporation of India.

All sample client, policy, payment, claim, and lead records are fictional and intended for demonstration purposes only.

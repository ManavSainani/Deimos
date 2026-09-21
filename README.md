# Deimos

### University of Tampa Capstone Project Archive and Discovery Platform

Deimos is a web-based platform designed to centralize, preserve, and improve the discovery of University of Tampa capstone projects.

The platform provides students and faculty with an organized archive of previous projects, including project descriptions, technologies, GitHub repositories, and documentation. It also explores automated repository analysis and AI-assisted features to help users discover related projects and learn from previous work.

## Team

**Team Localhost**

- Manav
- Rodrigo
- Andres
- Murat

## Problem Statement

University of Tampa capstone projects often become difficult to access after their presentations or course completion. Project repositories, documentation, and technical information may be scattered across personal GitHub accounts or other locations.

As a result:

- Students may struggle to find previous projects for reference.
- Faculty may need to manually organize project information.
- Technical documentation and repositories can become difficult to locate.
- Future teams have limited visibility into technologies and approaches used by previous students.

Deimos aims to address these challenges through a centralized and searchable capstone project archive.

## Project Goals

- Create a centralized archive of University of Tampa capstone projects.
- Organize projects by academic year, technology, and category.
- Provide searchable project information and documentation.
- Integrate with GitHub to retrieve repository information.
- Explore automated technology-stack extraction and project analysis.
- Help students discover related projects and potential project directions.
- Provide faculty oversight of project submissions and information.
- Develop an accessible, responsive, and maintainable web application.

## Planned Features

### Core Features

- Browse capstone projects organized by academic year.
- Search projects using keywords.
- Filter projects by year, technology, and category.
- View individual project pages.
- Submit completed capstone projects.
- Faculty review and approval of submissions.
- Student and faculty authentication.
- Role-based access control.
- GitHub repository integration.
- Repository metadata and programming language extraction.

### AI-Assisted Features

- Automated project information extraction.
- AI-assisted project summaries.
- Automated project categorization.
- Similar project discovery.
- Technology-stack identification.

AI-generated information will be reviewed when necessary to help ensure that publicly displayed project information is accurate.

### Potential Future Features

- Project recommendations based on user interests.
- Technology usage trends across academic years.
- Interactive analytics dashboards.
- Visualization of relationships between projects.
- Missing documentation and information detection.

Future features will depend on project scope, technical feasibility, and available development time.

## Technology Stack

The following technologies are currently being considered for the project:

| Component | Technology |
|-----------|------------|
| Frontend | React / Next.js |
| Programming Language | TypeScript |
| Backend | Next.js API Routes |
| Database | PostgreSQL / Supabase |
| Authentication | Supabase Auth |
| Repository Integration | GitHub REST API |
| AI Processing | Selected LLM API |
| Version Control | GitHub |
| Deployment | Vercel |

The technology stack may evolve as the project progresses.

## System Architecture

Deimos is planned as a modular web application consisting of:

- **Frontend:** User interface for browsing, searching, and managing projects.
- **Backend:** Application logic, authentication, authorization, and API services.
- **Database:** Storage for project information, users, repositories, and analysis results.
- **GitHub Integration:** Retrieval of repository metadata and documentation.
- **Analysis Pipeline:** Automated extraction and processing of technical information.
- **AI Processing:** Generation of structured project summaries and additional insights.

## User Roles

### Students

- Browse approved capstone projects.
- Search and filter archived projects.
- Submit project information.
- View submission status.
- Discover related projects.

### Faculty

- Review student submissions.
- Approve or reject projects.
- Manage archived project information.
- Review automated analysis and AI-generated information.
- Maintain the quality of publicly available project data.

## Accessibility and Security

Accessibility and security are important considerations throughout development.

The platform will aim to support:

- Keyboard-accessible navigation.
- Appropriate color contrast.
- Light and dark mode.
- Accessible form controls.
- Meaningful labels and alternative text.
- Responsive layouts.
- Semantic HTML.
- Secure authentication and authorization.
- Backend protection for restricted actions.
- Secure handling of API credentials.

## Development Workflow

The team will use GitHub for version control, collaboration, and project management.

Our proposed workflow includes:

1. Create an issue for each task or backlog item.
2. Assign the issue to a team member.
3. Create a feature branch.
4. Implement and test the changes.
5. Open a pull request.
6. Request a review from another team member.
7. Merge after review and successful checks.

## Project Status

**Status:** In Development

Deimos is currently in the planning and requirements phase. The team is establishing the initial architecture, defining requirements, and preparing the foundation for development.

## Project Scope

The initial development focus will be:

- Centralized project archive.
- Project search and filtering.
- Student project submissions.
- Faculty approval workflows.
- Authentication and role-based permissions.
- GitHub API integration.
- Basic repository analysis.

Advanced AI features, similarity discovery, and analytics will be developed based on feasibility and available development time.

## Repository Structure

The repository structure will be established as development begins.

Planned organization may include:

- `frontend/` - User interface and frontend components.
- `backend/` - Backend services and API functionality.
- `database/` - Database schemas and related resources.
- `docs/` - Project documentation and technical decisions.
- `tests/` - Automated and manual testing resources.

The structure may change as the architecture is finalized.

## Academic Context

**University:** University of Tampa  
**Project:** Computer Science Capstone  
**Team:** Localhost  
**Working Title:** Deimos


This project is developed as part of a University of Tampa Computer Science Capstone project.

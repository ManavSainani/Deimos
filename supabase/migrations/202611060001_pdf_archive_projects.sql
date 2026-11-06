-- Seed the approved archive with the projects transcribed from past projects.pdf.
-- Run after 202610260003_authorized_users.sql.

alter table public.projects
  add column if not exists team_name text not null default '',
  add column if not exists semester_label text;

insert into public.projects (
  id, title, team_name, semester_label, category, term, academic_year,
  description, team_members, technologies, repository_url, status, approved_at
)
values
  (
    'f0000000-0000-4000-8000-000000000001', 'SpaceByte', 'JACE', 'Fall 2026-Spring 2027',
    'AI / Machine Learning', 'Fall', 2026, 'SpaceByte is a food management and nutrition planning platform designed to help astronauts maintain healthy diets while managing limited food supplies during extended space missions. The web application combines inventory tracking, nutritional monitoring, and personalized meal planning into a unified system. Users can manage food supplies, track consumption, monitor nutritional goals, and receive meal recommendations based on available ingredients, dietary restrictions, and individual preferences. The platform incorporates food recognition technology to simplify inventory management and adapts nutritional planning to different environments, including Earth, the International Space Station, and the Moon. By balancing nutritional requirements with resource availability, SpaceByte aims to reduce food waste, improve meal variety, and support astronaut health and well-being during long-duration missions.',
    array['Amanda Balta', 'Jaidan Chiaradio', 'Eboni Huggins', 'Christa-Marie Seerattan']::text[], array[]::text[], null, 'approved', now()
  ),
  (
    'f0000000-0000-4000-8000-000000000002', 'SociaLyfe', 'JEKAM', 'Fall 2026-Spring 2027',
    'Mobile Application', 'Fall', 2026, 'SociaLyfe is a pirate-themed role-playing game designed to help incoming college students navigate campus life while developing healthier habits and achieving personal goals. Set within an interactive recreation of the University of Tampa campus, the game allows players to explore university buildings, complete location-based quests, and earn experience points to strengthen and customize their characters. Challenges encourage real-world activities such as studying, exercising, and exploring campus, connecting personal accomplishments to in-game progression. The platform incorporates character customization, achievements, and a quest system that rewards exploration and positive behaviors. By combining familiar role-playing mechanics with real-world objectives, SociaLyfe aims to make the transition to college more engaging while promoting academic success, physical activity, and personal well-being.',
    array['Jeremy Benjamin', 'Aaron Chinapoo', 'Edwin Melgar', 'Kevin Rivera Lugo', 'Mercedes VanArsdale']::text[], array[]::text[], null, 'approved', now()
  ),
  (
    'f0000000-0000-4000-8000-000000000003', 'Deimos', 'Local Host', 'Fall 2026-Spring 2027',
    'Web Application', 'Fall', 2026, 'Deimos is a centralized archive and discovery platform designed to preserve and showcase senior capstone projects at the University of Tampa. The web application allows students to explore previous projects, search by technology, category, or academic year, and submit their own work for faculty review and approval. By integrating with GitHub, the platform retrieves repository information, programming languages, and technical documentation to create comprehensive project records. AI-assisted analysis generates project summaries, identifies technologies, and recommends related projects based on shared characteristics. Role-based access provides students, faculty, and administrators with dedicated tools for submitting, reviewing, and managing project information. By making past work more accessible, Deimos encourages collaboration, supports future project development, and preserves the university''s growing collection of student innovations.',
    array['Rodrigo Asturias', 'Andres Ponce Sauceda', 'Manav Sainani', 'Murat Yildiz']::text[], array[]::text[], null, 'approved', now()
  ),
  (
    'f0000000-0000-4000-8000-000000000004', 'L.A.S.E.R. Team Rideshare App', 'Sold Data', 'Fall 2026-Spring 2027',
    'Mobile Application', 'Fall', 2026, 'L.A.S.E.R. Team Rideshare is a campus transportation platform designed to improve the safety, accessibility, and efficiency of the University of Tampa''s student golf cart service. The application replaces traditional phone-based ride requests with a streamlined system that allows students to request transportation, select campus pickup locations, and monitor their ride status in real time. Dedicated interfaces allow drivers to manage incoming requests, communicate with riders, and coordinate pickups, while a separate coordinator dashboard supports service oversight. GPS tracking provides vehicle location information, and an integrated messaging system facilitates communication between students and drivers. The platform also incorporates a reward system to encourage student engagement. By simplifying ride coordination and improving communication, L.A.S.E.R. Team Rideshare aims to provide a safer, more convenient campus transportation experience.',
    array['Jared Kendrick', 'Timothy Knapp', 'Owen O''Neil', 'Ryan Soroka', 'Adam Stafford']::text[], array[]::text[], null, 'approved', now()
  ),
  (
    'f0000000-0000-4000-8000-000000000005', 'Lung CT Computer Vision', 'The 3 Engineers', 'Fall 2026-Spring 2027',
    'AI / Machine Learning', 'Fall', 2026, 'Lung CT Computer Vision is an AI-powered medical imaging platform designed to identify and highlight potential pulmonary lesions in lung CT scans. Using deep learning and computer vision techniques, the system processes medical images through a trained U-Net neural network to identify regions that may contain abnormalities. The platform incorporates image preprocessing, automated lesion segmentation, and visual comparisons between original scans, expert annotations, and model predictions. By analyzing three-dimensional CT data, the system aims to improve the identification of suspicious regions while reducing the complexity of interpreting large medical imaging datasets. Designed as a research and educational prototype rather than a diagnostic tool, the project demonstrates the potential of artificial intelligence to support medical imaging analysis and advance research into automated lesion detection.',
    array['Luigi Molissani Zemlickas', 'Tarun Vigneswaran', 'Volodymyr Zabolotnyi']::text[], array[]::text[], null, 'approved', now()
  ),
  (
    'f0000000-0000-4000-8000-000000000006', 'HighlightMaxxer', 'TokenMaxxers', 'Fall 2026-Spring 2027',
    'AI / Machine Learning', 'Fall', 2026, 'HighlightMaxxer is an AI-powered video analysis platform designed to automatically identify and compile key moments from soccer matches. The web application allows players, coaches, and teams to upload full-length game recordings and receive an analysis of important events, such as goals, shots, and other significant plays. Using computer vision and machine learning models trained on soccer footage, the system detects noteworthy moments and marks their locations on an interactive video timeline. Users can quickly navigate to specific events and generate highlight reels without manually reviewing hours of footage. The platform focuses on adapting AI-based event detection to youth and collegiate soccer recordings, where camera angles and video quality can vary significantly. By automating highlight identification and video editing, HighlightMaxxer simplifies performance review, content creation, and the sharing of athletic achievements.',
    array['Jonathan Gallo', 'Ellis Hart', 'Jacob Igielski', 'Matthew Locker']::text[], array[]::text[], null, 'approved', now()
  ),
  (
    'f0000000-0000-4000-8000-000000000007', 'AllTheOdds', 'UTGI', 'Fall 2026-Spring 2027',
    'AI / Machine Learning', 'Fall', 2026, 'AllTheOdds is an AI-powered sports analytics platform designed to help users make more informed decisions when evaluating NFL betting opportunities. The web application collects and compares sportsbook odds, allowing users to identify favorable lines across multiple providers and examine historical odds movements. A custom predictive model analyzes historical football data to estimate game outcomes and highlight discrepancies between predicted probabilities and sportsbook odds. An integrated AI assistant allows users to ask questions about matchups, statistics, and betting opportunities using data collected by the platform. Additional features include hypothetical bet tracking, performance analysis, and responsible gambling safeguards. By combining real-time information, predictive modeling, and conversational AI, AllTheOdds provides an accessible platform for exploring sports betting data without placing actual wagers.',
    array['Sean Bender', 'Jarred Geng', 'Joey Parsons', 'Aidan Sheehy']::text[], array[]::text[], null, 'approved', now()
  ),
  (
    'f0000000-0000-4000-8000-000000000008', 'OpenSpot', 'OpenSpot', 'Spring 2026',
    'AI / Machine Learning', 'Spring', 2025, 'OpenSpot is a real-time parking monitoring system designed to reduce congestion, stress, and time wasted searching for available parking on campus. Currently, students and faculty have no visibility into garage occupancy, leading to traffic buildup and inefficiencies. OpenSpot addresses this by using a Raspberry Pi with a camera and a trained AI model to detect and track vehicles entering and exiting the primary student parking levels. The system distinguishes cars from pedestrians and other objects to ensure accurate counts. Powered by a solar-charged battery, it operates continuously and sustainably while providing reliable, real-time occupancy data.',
    array['Sayed Ali', 'Anthony Eccleston', 'Lailani Garcia', 'Jack Lancaster', 'Dhwaniben Patel', 'Khalil Smith']::text[], array[]::text[], null, 'approved', now()
  ),
  (
    'f0000000-0000-4000-8000-000000000009', '3D LiDAR Mapping', 'LiStars', 'Fall 2025-Spring 2026',
    'Hardware / Embedded Systems', 'Fall', 2025, '3D LiDAR Mapping is an open-source, low-cost system designed to make LiDAR-based environmental mapping accessible to smaller organizations and researchers. Using affordable LiDAR sensors, microcontrollers, and a custom 3D-printed platform, the system performs 360° scanning with real-time visualization of mapped environments. A rotating servo extends the design beyond static sensing, enabling multi-angle data capture for enhanced spatial awareness. The platform emphasizes interoperability, allowing integration with external systems for robotics, research, or security applications. Potential uses include perimeter monitoring, indoor mapping where GPS is unavailable, and situational awareness for emergency responders in hazardous or low-visibility conditions.',
    array['Bryton Montgomery', 'Sneha Patel', 'Zachary Swisher', 'Jamil Velez']::text[], array[]::text[], null, 'approved', now()
  ),
  (
    'f0000000-0000-4000-8000-000000000010', 'Glide+', 'Gliders', 'Fall 2025-Spring 2026',
    'Mobile Application', 'Fall', 2025, 'Glide+ is an AI-powered, all-in-one platform designed to help college students manage academics, habits, and travel within a single, unified app. It integrates Canvas assignment extraction, adaptive scheduling, habit tracking with gamification, and AI-driven academic advising to provide a comprehensive life-management tool. By consolidating planning, motivation, and social coordination into one experience, Glide+ reduces decision fatigue and minimizes the need to switch between multiple apps. The platform aims to improve time management, support stronger academic outcomes, and enhance student well-being, with future expansion opportunities targeting broader use among young professionals.',
    array['Wafae Benkassou', 'Hanna Berhane', 'Joseph DiMartino', 'Anthony Soria']::text[], array[]::text[], null, 'approved', now()
  ),
  (
    'f0000000-0000-4000-8000-000000000011', 'Campus Eats', 'Campus Eaters', 'Fall 2025-Spring 2026',
    'Hardware / Embedded Systems', 'Fall', 2025, 'Campus Eats is an autonomous meal delivery system designed to improve dining access for students with mobility challenges. The project combines GPS sensing, and a triple-axis gyroscope module for navigation, along with secure drop-off verification to deliver food safely and efficiently from dining halls to residence halls. Students can place and track orders through a dedicated website, receiving notifications when meals arrive. By reducing barriers to campus dining, Campus Eats promotes inclusivity, independence, and healthier lifestyles while demonstrating the potential of autonomous systems in accessible campus services.',
    array['Michael Beehler', 'Javon Bell', 'Maya Schroeder', 'Endi Troqe']::text[], array[]::text[], null, 'approved', now()
  ),
  (
    'f0000000-0000-4000-8000-000000000012', 'Smart Lab Check-In', 'Access Granted', 'Fall 2025-Spring 2026',
    'Hardware / Embedded Systems', 'Fall', 2025, 'Smart Lab Check-In is a system designed to manage access and equipment usage in the UTampa Makerspace. Using RFID scanning integrated with student ID systems, it tracks lab entry, equipment check-out, and return activity. The platform improves accountability by reducing loss or damage, enforcing access restrictions, and providing real-time visibility into equipment availability. To support deployment and testing, the system includes custom-programmed RFID tags attached to Makerspace items. By streamlining operations and improving oversight, Smart Lab Check-In enhances organization, increases lab utilization, and encourages broader student engagement with campus technology resources.',
    array['Daniel Cirincione', 'Trevor Desiderio', 'Michael Dimucci', 'Nathaniel Frait', 'Michael LaMonica']::text[], array[]::text[], null, 'approved', now()
  ),
  (
    'f0000000-0000-4000-8000-000000000013', 'Everywhere Anytime Ready for Loading (E.A.R.L.) Bot', 'E.A.R.L.', 'Fall 2025-Spring 2026',
    'Hardware / Embedded Systems', 'Fall', 2025, 'E.A.R.L. Bot is a self-following transport robot designed to help students, faculty, and staff carry books, equipment, and supplies across campus with minimal effort. Using UWB tracking, the robot locks onto a user''s tag and autonomously follows them while avoiding obstacles with onboard sensors. It features smooth motion control and a secure cargo compartment for safely transporting personal belongings. By reducing the physical strain of carrying heavy loads, E.A.R.L. Bot enhances campus convenience and demonstrates potential applications in environments such as airports, hospitals, and warehouses.',
    array['Daniel Jaffe', 'Michelle Lee', 'Christopher Nucci', 'Hien Tran']::text[], array[]::text[], null, 'approved', now()
  ),
  (
    'f0000000-0000-4000-8000-000000000014', 'Smart Pantry – AI Food Waste Reducer', 'The Pantry Guardians', 'Fall 2025-Spring 2026',
    'AI / Machine Learning', 'Fall', 2025, 'Smart Pantry is an AI-powered household inventory and meal-planning system designed to reduce food waste and save money. Users can scan barcodes, upload images, or automatically process receipts using AI to log items, track expiration dates, and receive timely reminders before food spoils. The platform suggests recipes based on available ingredients and syncs shopping lists across household members. By improving visibility and coordination in the kitchen, Smart Pantry helps users minimize waste, lower grocery costs, and adopt more sustainable consumption habits.',
    array['Michael Krueger', 'Parker Malmgren', 'Creed McFall', 'Zachary Meyer']::text[], array[]::text[], null, 'approved', now()
  ),
  (
    'f0000000-0000-4000-8000-000000000015', 'ShadeSync', 'The Light Benders', 'Fall 2025-Spring 2026',
    'Hardware / Embedded Systems', 'Fall', 2025, 'ShadeSync is an automated window-shade system designed to improve sleep quality, morning wakefulness, and overall comfort. The device closes blinds at night to block disruptive light and opens them in the morning to allow natural sunlight to wake users gently. The prototype features custom-designed enclosures and a modular frame system for reliable deployment. Future enhancements include adaptive learning to suggest changes based on user behavior and weather to optimize light and temperature. By aligning light exposure with natural circadian rhythms, ShadeSync helps users start their day more naturally and with less grogginess.',
    array['Matthew Dauria', 'Jake Sussner', 'Brian Quintero']::text[], array[]::text[], null, 'approved', now()
  ),
  (
    'f0000000-0000-4000-8000-000000000016', 'UTampa App', 'Gourd’s Children', 'Fall 2024-Spring 2025',
    'Mobile Application', 'Fall', 2024, 'UTampa app is a comprehensive mobile application designed for the University of Tampa community. It caters not only to students but also to visitors, prospective students, and anyone interested in exploring or learning more about the university. The app offers a variety of features, including a student login for accessing course schedules and Spartan ID, real-time parking garage occupancy updates, an interactive campus map, and much more. This will be the university''s first all-in-one mobile app, providing a unified platform for public engagement.',
    array['Christian Carranza', 'Calvin Grant', 'Umang Gurung', 'Derien Hartline', 'Troy Kopec', 'Connor Loudermilk', 'Alex Rodriguez', 'Annie Rome', 'Abhigyan Tripathi']::text[], array[]::text[], null, 'approved', now()
  ),
  (
    'f0000000-0000-4000-8000-000000000017', 'SkySeeker', 'Cabin Crew', 'Spring 2025',
    'Hardware / Embedded Systems', 'Spring', 2024, 'This project aims to solve the problem of limited access to real-time, localized flight tracking data. It provides an affordable and accessible solution for aviation enthusiasts, hobbyists, or local communities to monitor planes in their vicinity. The project will feature a game component where aircrafts scanned by the antenna can be “collected” in a Pokémon Go like fashion.',
    array['Carlos Flautero', 'Hunter Montalvo', 'Kevin Panasiuk', 'Nicholas Ratti', 'Morgan Rault']::text[], array[]::text[], null, 'approved', now()
  ),
  (
    'f0000000-0000-4000-8000-000000000018', 'Attendify', 'SENND', 'Spring 2025',
    'AI / Machine Learning', 'Spring', 2024, 'Attendify is an attendance system run by facial recognition designed to automate attendance-taking in classrooms, workplaces, or events. Instead of manually checking attendance, this Google Chrome extension will use a Raspberry Pi camera to capture images of students as they enter a room, compare them to a pre-existing database of registered faces, and mark attendance automatically. The goal is to improve efficiency, reduce time taken, and eliminate the possibility of human error. The target audience is any teacher or administrator looking to shorten the time it takes for attendance.',
    array['Liz Denson', 'Nathaniel Gonzalez', 'Sara Hrnciar', 'Devin Mason', 'Nicole Scott']::text[], array[]::text[], null, 'approved', now()
  )
on conflict (id) do update set
  title = excluded.title,
  team_name = excluded.team_name,
  semester_label = excluded.semester_label,
  category = excluded.category,
  term = excluded.term,
  academic_year = excluded.academic_year,
  description = excluded.description,
  team_members = excluded.team_members,
  technologies = excluded.technologies,
  repository_url = excluded.repository_url,
  status = excluded.status,
  approved_at = excluded.approved_at,
  updated_at = now();

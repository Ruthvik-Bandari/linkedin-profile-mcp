// Section-by-section guidance. Built from a senior technical recruiter's talk on how
// recruiters search LinkedIn, plus lessons from rebuilding real profiles with it.

export const SECTIONS: Record<string, string> = {
  how_recruiters_search: `How recruiters find you
- They search before they read: the hiring manager gives the must-haves, and the recruiter searches by title, company, skills, location, years of experience and keywords. A profile without those words never shows up.
- Machines read first: keywords go through LinkedIn Recruiter and other AI tools before a person looks.
- Mirror 5 to 10 real job descriptions for your target role; reuse their exact terms where they truly describe your work.
- Location is a filter: list your real metro (for example "Boston, MA"), never only a country.
- The 10-second test: target role, where you have done the work, proof of what you built, shipped or improved. Title and companies must be clear in about five seconds.`,

  before_editing: `Before you start editing
- Turn off "Share profile updates with your network" (Settings, Visibility); turn it back on at the end and post once.
- Pick one target role family; every section should point at it.
- Keep your résumé open: titles, dates and company names must match exactly.`,

  photo: `Photo
- Recent, clear, your face, smiling, professional clothing, plain background, good light. People should recognize you in person.
- An AI touch-up of background or lighting is fine; keep your face real. Square, at least 400 x 400 px.`,

  banner: `Background banner
- Never blank. Use an anchor people recognize: city skyline, campus, or you presenting.
- 1584 x 396 px. Keep key parts away from the lower left (photo) and the far edges (mobile crops).
- A short line (role and domain, under eight words) works. No logos you lack permission for.`,

  headline: `Headline (220 characters)
- Role first, then skills, where you work or study, proof, and the roles you are open to. Use most of the 220.
- The first ~60 characters show in search and invitations: they must state role and domain alone.
- Avoid vague labels ("Aspiring ...", "Student at X", a bare "MBA candidate").
- Shape: Full-Stack Engineer | React, Node.js, AWS | Built and shipped [project] | Open to backend and platform roles`,

  location_contact: `Location, contact info and custom URL
- Pick your metro from the dropdown; no street address in contact info.
- Custom URL linkedin.com/in/firstname-lastname, same link on your résumé.
- A personal email you keep after graduation, plus GitHub or portfolio.`,

  open_to_work: `Open to Work
- Recruiter title filters match your current title; as a student or intern, the titles you list here are how title searches find you. List the exact titles you want.
- Add locations and work types; choose full-time only if that is what you want.
- "Recruiters only" keeps it private from your network; "Everyone" adds the green frame and shows preferences publicly.
- Be honest about the start date.`,

  about: `About (2,600 characters)
- Plain first person, 1,600 to 2,400 characters: role, domain and strongest proof first; two or three short stories with numbers; a few lines of searchable skills; a call to action with your email and target roles.
- Sound human: avoid em dashes, "passionate about", "leverage", "results-driven", "it's not X, it's Y". Cut any sentence that could sit on someone else's profile.
- Pick five Top skills under About.`,

  featured: `Featured
- Your proof shelf: projects, papers, press, talks, and the one post you most want read. Strongest first.
- Titles show ~45 characters, descriptions ~200: front-load the result. Remove stale items such as an old résumé.`,

  experience: `Experience (2,000 characters per role)
- Impact, not duties. Say what the team does, what you built, numbers, stack and who you worked with.
- First line explains the role alone with a keyword; then 4 to 7 bullets, each starting with a verb and ending with a result.
- Official title, company picked from the dropdown, dates identical to your résumé.
- Credit team work honestly; never share confidential names, data or results.
- Attach 3 to 5 skills per role, only ones that role used.
- Weak: "Worked on machine learning models." Strong: "Built a fraud classifier in Python and XGBoost that cut false positives 30% on 2M transactions, shipped behind a FastAPI service."`,

  skills: `Skills
- These are the search terms: exact spelling from postings and LinkedIn's dropdown. Most important first; up to 100.
- Remove anything you could not discuss in an interview.`,

  projects: `Projects
- Two to six that match your target role: name, dates, link, and a description like an Experience entry (what it does, your part, result, stack). Say "team project" when it was one.`,

  education: `Education
- Current program first; exact degree name; dates; GPA if it helps; a one-line list of relevant courses adds keywords.`,

  other_sections: `Publications, Honors, Certifications, Languages
- Publications: real title, venue, status (accepted, preprint), co-authors, DOI or link.
- Honors: issuer, date, one line on what you built. Certifications: only relevant ones, no duplicates. Languages: professional ones first, honest proficiency.`,

  beyond_profile: `Beyond the profile
- Pass 500 connections, then grow toward 1,000 followers: classmates, event contacts, engineers at target companies.
- One post about what you want to be known for; the first two lines must hook (~200 characters show). Real engagement only.
- Comment thoughtfully on peers' posts. In outreach, a mutual connection nearly guarantees a reply; otherwise mention something specific. Notes under 200 characters.
- Positioning: be near the top in a combination few people have, then find roles that need that combination.
- Keep it current. Sourcers find candidates and recruiters close offers; a posting can draw 200 to 5,000 applicants, so a rejection is rarely personal. University recruiting runs roughly July through the fall; most new grad slots fill by January.`,

  checklist: `Final checklist
- A stranger can name your target role from the headline in five seconds.
- Real metro set; Open to Work lists the exact titles you want.
- Every Experience entry has a clear first line, numbers and skills.
- Featured shows your best proof first; nothing stale.
- Titles, dates and names match your résumé.
- No em dashes or stock AI phrases.
- Nothing confidential; every claim is one you can explain in an interview.
- Check in a private window and on your phone; turn update sharing back on and post once.`,
};

export const FULL_GUIDE = Object.values(SECTIONS).join("\n\n");

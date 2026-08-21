# Ingest suggestions

Based on samples from scraper gate-fail items:

## Case Study: From behind-the-scenes metallurgical engineer to keynote speaker, radio host, and respected mining commentator: Rachiel Bvurire scales new heights

- id: fe24e995-6358-4ec2-acea-a0b5265e614f

- source: Australia Awards

- deadline: None

- country: None

- applyLink: https://australiaawardsafrica.org/news/case-study-from-behind-the-scenes-mining-engineer-to-keynote-speaker-radio-host-and-respected-mining-commentator-rachiel-bvurire-scales-new-heights/



## Addis Ababa workshop empowers alumnae to elevate leadership potential and navigate career challenges

- id: cecbb1dc-e98a-44ab-b0e3-7b7aa10e9bfe

- source: Australia Awards

- deadline: 2026-08-06

- country: None

- applyLink: https://australiaawardsafrica.org/news/addis-ababa-workshop-empowers-alumnae-to-elevate-leadership-potential-and-navigate-career-challenges/



## See what our Alumni have to say about their experience

- id: b9a5a896-cfb4-4a3e-b490-1013183ff2c2

- source: Australia Awards

- deadline: None

- country: None

- applyLink: https://australiaawardsafrica.org/quota-grams/



## Apply for an Australia Awards Masters Scholarship

- id: 74b9ca8f-342e-4050-9deb-b9496e1316ad

- source: Australia Awards

- deadline: 2027-02

- country: None

- applyLink: https://australiaawardsafrica.org/awards/apply/



## YTB&#x2013;IsDB Joint Scholarship Program Meeting

- id: aaab442a-501b-460f-9815-11968bc47ff2

- source: Türkiye Scholarships

- deadline: None

- country: None

- applyLink: https://www.turkiyeburslari.gov.tr/news/ytbisdb-joint-scholarship-program-meeting-123



## Recommendations

- Extract `applyLink` and prefer items with a clear application URL; skip generic news pages.

- Improve `country` detection: parse page metadata and normalize country names; fallback to language/ccTLD heuristics.

- Normalize `deadline`: parse ISO, YYYY-MM, and common textual dates; treat year-only or month-only as end-of-month.

- If `deadline` missing and `itemType` is scholarship/job, mark `needs_review` and show editors the most-likely date.

- Reject items whose content is clearly informational ("How to apply", "Admission requirements") without an `applyLink`.

- Add heuristics to detect placeholders (titles like "Announcement", "Latest issue") and discard them.

- Consider running a light HTTP HEAD on `applyLink` to ensure valid target and detect 404s.

- Persist extracted images only when `raw_cover_image` points to a valid image URL; fallback to site favicon.



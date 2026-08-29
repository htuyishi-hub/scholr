with open("artifacts/scholr/src/pages/admin/posts-form.tsx", "r") as f:
    content = f.read()

# Add import
if "convertGoogleDriveLink" not in content:
    content = content.replace(
        'import { normalizeOpportunityStructuredData } from "@/lib/opportunity-structure";', 
        'import { normalizeOpportunityStructuredData } from "@/lib/opportunity-structure";\nimport { convertGoogleDriveLink } from "@/lib/utils";'
    )

# Replace the onChange handler
content = content.replace(
    'onChange={e => setField("coverImage", e.target.value)}',
    'onChange={e => setField("coverImage", convertGoogleDriveLink(e.target.value))}'
)

with open("artifacts/scholr/src/pages/admin/posts-form.tsx", "w") as f:
    f.write(content)


with open("artifacts/scholr/src/pages/admin/editorial-item.tsx", "r") as f:
    content = f.read()

# Add import
if "convertGoogleDriveLink" not in content:
    content = content.replace(
        'import { Badge } from "@/components/ui/badge";',
        'import { Badge } from "@/components/ui/badge";\nimport { convertGoogleDriveLink } from "@/lib/utils";'
    )

# Replace the onChange handler
content = content.replace(
    'onChange={(e) => updateForm({ coverImage: e.target.value })}',
    'onChange={(e) => updateForm({ coverImage: convertGoogleDriveLink(e.target.value) })}'
)

with open("artifacts/scholr/src/pages/admin/editorial-item.tsx", "w") as f:
    f.write(content)


const NOTION_API = 'https://api.notion.com/v1';

export function notionHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28',
  };
}

export async function getTitlePropName(dbId, token) {
  try {
    const res = await fetch(`${NOTION_API}/databases/${dbId}`, {
      headers: notionHeaders(token),
    });
    if (!res.ok) return 'Name';
    const data = await res.json();
    const entry = Object.entries(data.properties || {}).find(([, v]) => v.type === 'title');
    return entry ? entry[0] : 'Name';
  } catch {
    return 'Name';
  }
}

export async function createPage(dbId, token, titlePropName, title, children) {
  const res = await fetch(`${NOTION_API}/pages`, {
    method: 'POST',
    headers: notionHeaders(token),
    body: JSON.stringify({
      parent: { database_id: dbId },
      properties: {
        [titlePropName]: {
          title: [{ text: { content: title } }],
        },
      },
      children,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || res.statusText);
  }
  return res.json();
}

export function para(text) {
  return {
    object: 'block', type: 'paragraph',
    paragraph: { rich_text: [{ type: 'text', text: { content: text } }] },
  };
}

export function heading(text) {
  return {
    object: 'block', type: 'heading_3',
    heading_3: { rich_text: [{ type: 'text', text: { content: text } }] },
  };
}

export function divider() {
  return { object: 'block', type: 'divider', divider: {} };
}

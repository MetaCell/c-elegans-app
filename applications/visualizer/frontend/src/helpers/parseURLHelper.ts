interface WorkspaceParams {
  mode: string;
  workspaces: {
    name: string;
    ids: string[];
  }[];
}

export function parseURLParams(url: string): WorkspaceParams {
  const params = new URLSearchParams(url);
  let mode = '';
  const workspaces: { name: string; ids: string[] }[] = [];
  
  let currentWorkspace: { name: string; ids: string[] } | null = null;
  
  params.forEach((value, key) => {
    if (key.includes('mode')) {
      mode = value;
    } else if (key.startsWith('ws_name')) {
      if (currentWorkspace) {
        workspaces.push(currentWorkspace);
      }
      currentWorkspace = {
        name: value,
        ids: []
      };
    } else if (key.startsWith('ids')) {
      if (currentWorkspace) {
        currentWorkspace.ids = value.split(',');
      }
    }
  });
  
  if (currentWorkspace) {
    workspaces.push(currentWorkspace);
  }
  
  return { mode: mode, workspaces: workspaces };
}
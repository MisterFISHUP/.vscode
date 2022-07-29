const githubUser = "MisterFISHUP";
const githubRepo = ".vscode";
const entries = [
  { name: "/User/settings.json", filePath: "vim-keybindings.json" },
  { name: "/User/keybindings.json", filePath: "keybindings.json" },
];

const dbName = "vscode-web-db";
const dbVersion = 2;
const tableName = "vscode-userdata-store";

async function fetchData() {
  const fetchBaseUrl = `https://api.github.com/repos/${githubUser}/${githubRepo}/contents/`;
  const data = [];

  for (const entry of entries) {
    try {
      const fetchFile = await fetch(fetchBaseUrl + entry.filePath);
      const file = await fetchFile.json();
      const fileContent = file.content;
      data.push({
        key: entry.name,
        value: new TextEncoder().encode(atob(fileContent)),
      });

      console.log(
        `Successfully fetched ${entry.filePath}'s content from ${githubUser}'s repo ${githubRepo}`
      );
    } catch (e) {
      console.log(
        `Failed to fetch ${entry.filePath}'s content from ${githubUser}'s repo ${githubRepo}`
      );
    }
  }

  return data;
}

async function updateDB() {
  const data = await fetchData();

  const indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDB;

  if (!indexedDB) {
    console.log("IndexedDB could not be found in this browser.");
  }

  const request = indexedDB.open(dbName, dbVersion);

  request.onerror = (event) => {
    console.log(`Failed to open ${dbName}, version ${dbVersion}`);
  };

  request.onupgradeneeded = (event) => {
    const db = event.target.result;

    const objectStore = db.createObjectStore(tableName);
  };

  request.onsuccess = (event) => {
    const db = event.target.result;

    const transaction = db.transaction([tableName], "readwrite");

    transaction.oncomplete = (event) => {
      console.log("DB transaction completed");
    };

    transaction.onerror = (event) => {
      console.log("DB transaction error");
    };

    const objectStore = transaction.objectStore(tableName);

    data.forEach((entry) => {
      const requestUpdate = objectStore.put(entry.value, entry.key);

      requestUpdate.onerror = (event) => {
        console.log(`Failed to update ${entry.key} in ${tableName}`);
      };

      requestUpdate.onsuccess = (event) => {
        console.log(`Successfully updated ${entry.key} in ${tableName}`);
      };
    });
  };
}

updateDB();

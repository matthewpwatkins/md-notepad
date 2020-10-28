class LocalStorageFileManager {
    constructor() {

    }

    listFiles() {
        const metadataKeys = [];
        for (const key in localStorage) {
            if (key.startsWith('files/') && key.endsWith('/metadata')) {
                metadataKeys.push(key);
            }
        }
        metadataKeys.sort();
        return metadataKeys.map(metadataKey => this.readMetadata(metadataKey));
    }

    lookupFile(fileName) {
        return this.readMetadata(`files/${fileName}/metadata`);
    }

    readMetadata(metadataRecordName) {
        const fileMetadataJson = localStorage.getItem(metadataRecordName);
        if (!fileMetadataJson || !fileMetadataJson.length) {
            return { exists: false };
        }

        const fileMetadata = JSON.parse(fileMetadataJson);
        fileMetadata.exists = true;
        return fileMetadata;
    }

    readFile(fileName) {
        const fileContentRecordName = `files/${fileName}/content`;
        return localStorage.getItem(fileContentRecordName);
    }

    saveFile(fileMetadata, fileContent) {
        fileMetadata.lastEdit.dateTime = Date.now();
        localStorage.setItem(`files/${fileMetadata.name}/metadata`, JSON.stringify(fileMetadata));
        localStorage.setItem(`files/${fileMetadata.name}/content`, fileContent);
    }

    deleteFile(fileName) {
        localStorage.removeItem(`files/${fileName}/metadata`)
        localStorage.removeItem(`files/${fileName}/content`)
    }
}
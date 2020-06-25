'use strict';

export class LocalStorageFileManager {
    constructor() {

    }

    listFiles() {
        const files = [];
        for (const recordKey in localStorage) {
            if (recordKey.startsWith('files/') && recordKey.endsWith('/metadata.json')) {
                files.push(this.readMetadata(recordKey));
            }
        }
        return files;
    }

    lookupFile(fileName) {
        return this.readMetadata(`files/${fileName}/metadata.json`);
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
        const fileContentRecordName = `files/${fileName}/content.txt`;
        return localStorage.getItem(fileContentRecordName);
    }

    saveFile(fileMetadata, fileContent) {
        fileMetadata.lastEdit.dateTime = Date.now();
        localStorage.setItem(`files/${fileMetadata.name}/metadata.json`, JSON.stringify(fileMetadata));
        localStorage.setItem(`files/${fileMetadata.name}/content.txt`, fileContent);
    }
}
'use strict';

import { LocalStorageFileManager } from './local-storage-file-manager.js';

const DARK_MODE_COOKIE_NAME = 'DARK_MODE';
const AUTO_SAVE_INTERVAL = 5000;
const MD = new window.remarkable.Remarkable("full");
const FILE_MANAGER = new LocalStorageFileManager();

const app = new Vue({
    el: '#app',
    data: {
        darkMode: false,
        mounted: false,
        files: [],
        activeFile: null,
        dirty: false,
        lastSave: 0,
        saveInProgress: false
    },
    computed: {
        activeFilePreview: function() {
            return (this.activeFile && this.activeFile.content) ? MD.render(this.activeFile.content) : null;
        }
    },
    mounted() {
        this.setTheme();
        this.initialize();
        this.listenForKeyboardShortcuts();
        this.startAutoSaveTimer();
        this.mounted = true;
    },
    methods: {
        setTheme() {
            this.darkMode = Cookies.get(DARK_MODE_COOKIE_NAME) === true.toString();
        },
        initialize() {
            this.files = FILE_MANAGER.listFiles();
            if (this.files.length) {
                const mostRecentFileIndex = 0;
                for (const i = 1; i < this.files.length; i++) {
                    if (this.files[i].lastEdit.dateTime > this.files[mostRecentFileIndex].lastEdit.dateTime) {
                        mostRecentFileIndex = i;
                    }
                }
                this.activeFile = {
                    index: mostRecentFileIndex,
                    content: FILE_MANAGER.readFile(this.files[mostRecentFileIndex].name)
                };
            }
        },
        listenForKeyboardShortcuts() {
            this.keyListener = function(e) {
                if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    this.saveActiveFile();
                } else {
                    this.dirty = true;
                }
            };
            document.addEventListener('keydown', this.keyListener.bind(this));
        },
        createNewFile() {
            let fileName = prompt('File name? Make it awesome :)');
            fileName = fileName ? fileName.trim() : fileName;
            // TODO: Validate file name is valid and does not already exist
            if (fileName && fileName.length) {
                const fileMetadata = { name: fileName, lastEdit: { dateTime: 0 } };
                FILE_MANAGER.saveFile(fileMetadata, '');
                this.files.push(fileMetadata);
                this.activeFile = {
                    index: this.files.length - 1,
                    content: ''
                };
            }
        },
        openFile(fileIndex) {
            const file = this.files[fileIndex];
            this.activeFile = {
                index: fileIndex,
                content: FILE_MANAGER.readFile(file.name)
            };
        },
        startAutoSaveTimer() {
            this.autoSaveTimer = setInterval(() => {
                if (this.activeFile) {
                    const now = new Date().getTime();
                    const file = this.files[this.activeFile.index];
                    if (this.dirty && !this.saveInProgress && now > this.lastSave + AUTO_SAVE_INTERVAL - 1000) {
                        this.saveInProgress = true;
                        const savedAt = new Date().getTime();
                        this.saveActiveFile();
                        setTimeout(() => {
                            this.dirty = false;
                            this.lastSave = savedAt;
                            this.saveInProgress = false;
                        }, 750);
                    }
                }
            }, AUTO_SAVE_INTERVAL);
        },
        toggleTheme() {
            this.darkMode = !this.darkMode;
            console.log(Cookies);
            Cookies.set(DARK_MODE_COOKIE_NAME, this.darkMode.toString());
            console.log(Cookies.get(DARK_MODE_COOKIE_NAME));
        },
        saveActiveFile() {
            const file = this.files[this.activeFile.index];
            FILE_MANAGER.saveFile(file, this.activeFile.content);
        },
        removeKeyboardShortcuts() {
            document.removeEventListener('keydown', this.keyListener);
        },
        stopAutoSaveTimer() {
            clearInterval(this.autoSaveTimer);
        },
        beforeDestroy() {
            this.removeKeyboardShortcuts();
        }
    }
});
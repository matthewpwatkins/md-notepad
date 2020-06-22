'use strict';

const DARK_MODE_COOKIE_NAME = 'DARK_MODE';
const AUTO_SAVE_INTERVAL = 5000;
const NEW_FILE_NAME = 'Untitled';
const TEMP_FILE_PATH = 'temp';
const FILE_PREFIX = 'file/';
const MD = new window.remarkable.Remarkable("full");

const app = new Vue({
    el: '#app',
    data: {
        darkMode: false,
        mounted: false,
        files: [],
        activeFile: {},
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
            const files = [{ name: NEW_FILE_NAME, active: true }];
            for (const key in localStorage) {
                if (key.startsWith(FILE_PREFIX)) {
                    files.push({ name: key.substring(FILE_PREFIX.length) });
                }
            }
            this.files = files;
            this.activeFile = { index: 0, content: '' };
            this.openFile(0);
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
        startAutoSaveTimer() {
            this.autoSaveTimer = setInterval(() => {
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
            }, AUTO_SAVE_INTERVAL);
        },
        toggleTheme() {
            this.darkMode = !this.darkMode;
            console.log(Cookies);
            Cookies.set(DARK_MODE_COOKIE_NAME, this.darkMode.toString());
            console.log(Cookies.get(DARK_MODE_COOKIE_NAME));
        },
        openFile(fileIndex) {
            const file = this.files[fileIndex];
            this.files[this.activeFile.index].active = false;
            const filePath = file.name === NEW_FILE_NAME ? TEMP_FILE_PATH : `${FILE_PREFIX}${file.name}`;
            this.activeFile = {
                index: fileIndex,
                content: localStorage.getItem(filePath)
            }
            file.active = true;
        },
        saveActiveFile() {
            const file = this.files[this.activeFile.index];
            let filePath = file.name === NEW_FILE_NAME ? TEMP_FILE_PATH : `${FILE_PREFIX}${file.name}`;
            localStorage.setItem(filePath, this.activeFile.content);
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
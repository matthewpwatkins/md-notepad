'use strict';

const NEW_FILE_NAME = 'Untitled';
const FILE_PREFIX = 'file/';
const MD = new window.remarkable.Remarkable("full");

const app = new Vue({
    el: '#app',
    data: {
        mounted: false,
        files: [],
        activeFile: {}
    },
    computed: {
        activeFilePreview: function() {
            return (this.activeFile && this.activeFile.content) ? MD.render(this.activeFile.content) : null;
        }
    },
    mounted() {
        this.initialize();
        this.mounted = true;
    },
    methods: {
        initialize() {
            const files = [{ name: NEW_FILE_NAME, active: true, dirty: true }];
            for (const key in localStorage) {
                if (key.startsWith(FILE_PREFIX)) {
                    files.push({ name: key.substring(FILE_PREFIX.length) });
                }
            }
            this.files = files;
            this.activeFile = { index: 0, content: '' };
        },
        openFile(fileIndex) {
            const file = this.files[fileIndex];
            this.files[this.activeFile.index].active = false;
            this.activeFile = {
                index: fileIndex,
                content: localStorage.getItem(FILE_PREFIX + file.name)
            }
            file.active = true;
        },
        saveActiveFile() {
            const file = this.files[this.activeFile.index];
            let fileName = file.name;
            if (fileName === NEW_FILE_NAME) {
                fileName = prompt('Give your title a file name!');
            }
            localStorage.setItem(FILE_PREFIX + fileName, this.activeFile.content);
            file.name = fileName;
            file.dirty = false;
        }
    }
});
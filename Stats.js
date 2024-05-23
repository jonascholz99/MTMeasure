
class StatsManager {
    constructor() {
        this.container = document.createElement('div');
        this.container.style.cssText = 'position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000';
        this.container.addEventListener('click', (event) => {
            event.preventDefault();
            this.showPanel(++this.mode % this.container.children.length);
        }, false);

        this.mode = 0;
        this.beginTime = (performance || Date).now();
        this.prevTime = this.beginTime;
        this.frames = 0;

        this.fpsPanel = this.addPanel(new StatsManager.Panel('FPS', '#0ff', '#002'));
        this.msPanel = this.addPanel(new StatsManager.Panel('MS', '#0f0', '#020'));

        if (self.performance && self.performance.memory) {
            this.memPanel = this.addPanel(new StatsManager.Panel('MB', '#f08', '#201'));
        }

        this.showPanel(0);
        this.data = {
            fps: [],
            ms: [],
            memory: []
        };
    }

    addPanel(panel) {
        this.container.appendChild(panel.dom);
        return panel;
    }

    showPanel(id) {
        for (let i = 0; i < this.container.children.length; i++) {
            this.container.children[i].style.display = i === id ? 'block' : 'none';
        }
        this.mode = id;
    }

    begin() {
        this.beginTime = (performance || Date).now();
    }

    end() {
        this.frames++;
        const time = (performance || Date).now();
        const ms = time - this.beginTime;
        this.msPanel.update(ms, 200);

        if (time > this.prevTime + 1000) {
            const fps = (this.frames * 1000) / (time - this.prevTime);
            this.fpsPanel.update(fps, 100);
            this.prevTime = time;
            this.frames = 0;

            if (this.memPanel) {
                const memory = performance.memory;
                this.memPanel.update(memory.usedJSHeapSize / 1048576, memory.jsHeapSizeLimit / 1048576);
                this.data.memory.push({
                    time: (time - this.beginTime) / 1000,
                    memory: memory.usedJSHeapSize / 1048576
                });
            }
            this.data.fps.push({
                time: (time - this.beginTime) / 1000,
                fps: fps
            });
            this.data.ms.push({
                time: (time - this.beginTime) / 1000,
                ms: ms
            });
        }

        return time;
    }

    update() {
        this.beginTime = this.end();
    }

    startMonitoring(duration) {
        const startTime = Date.now();
        const animate = () => {
            this.begin();
            const currentTime = Date.now();
            const deltaTime = currentTime - this.prevTime;
            this.prevTime = currentTime;

            if (deltaTime > 0) {
                const fps = 1000 / deltaTime;
                this.data.fps.push({
                    time: (currentTime - startTime) / 1000, // Zeit in Sekunden
                    fps: fps
                });
            }

            this.end();

            if (currentTime - startTime < duration) {
                requestAnimationFrame(animate);
            } else {
                this.exportData();
            }
        };
        requestAnimationFrame(animate);
    }

    exportData() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.data));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "monitoringData.json");
        document.body.appendChild(downloadAnchorNode); // erforderlich für Firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }
}

StatsManager.Panel = function ( name, fg, bg ) {
    const min = Infinity, max = 0, round = Math.round;
    const PR = round(window.devicePixelRatio || 1);

    const WIDTH = 80 * PR, HEIGHT = 48 * PR,
        TEXT_X = 3 * PR, TEXT_Y = 2 * PR,
        GRAPH_X = 3 * PR, GRAPH_Y = 15 * PR,
        GRAPH_WIDTH = 74 * PR, GRAPH_HEIGHT = 30 * PR;

    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    canvas.style.cssText = 'width:80px;height:48px';

    const context = canvas.getContext('2d');
    context.font = 'bold ' + (9 * PR) + 'px Helvetica,Arial,sans-serif';
    context.textBaseline = 'top';

    context.fillStyle = bg;
    context.fillRect(0, 0, WIDTH, HEIGHT);

    context.fillStyle = fg;
    context.fillText(name, TEXT_X, TEXT_Y);
    context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);

    context.fillStyle = bg;
    context.globalAlpha = 0.9;
    context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);

    return {
        dom: canvas,
        update: function (value, maxValue) {
            context.fillStyle = bg;
            context.globalAlpha = 1;
            context.fillRect(0, 0, WIDTH, GRAPH_Y);
            context.fillStyle = fg;
            context.fillText(round(value) + ' ' + name + ' (' + round(min) + '-' + round(max) + ')', TEXT_X, TEXT_Y);

            context.drawImage(canvas, GRAPH_X + PR, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT, GRAPH_X, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT);

            context.fillRect(GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, GRAPH_HEIGHT);

            context.fillStyle = bg;
            context.globalAlpha = 0.9;
            context.fillRect(GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, round((1 - (value / maxValue)) * GRAPH_HEIGHT));
        }
    };
}
export { StatsManager }
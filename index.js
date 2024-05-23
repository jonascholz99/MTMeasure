import * as SPLAT from "@jonascholz/gaussian-splatting"
import Stats from "stats.js/src/Stats.js";
import { StatsManager } from "./Stats.js"

const canvas = document.getElementById("canvas");
const progressDialog = document.getElementById("progress-dialog");
const progressIndicator = document.getElementById("progress-indicator");

const renderer = new SPLAT.WebGLRenderer(canvas);
const scene = new SPLAT.Scene();
const camera = new SPLAT.Camera();
const controls = new SPLAT.OrbitControls(camera, canvas);

// Stats
var stats = new Stats();
stats.showPanel( 0);
document.body.appendChild( stats.dom );

// own class
const statsManager = new StatsManager();
document.body.appendChild(statsManager.container);
async function main() {
    const url = "./splats/edit_zw1027_4.splat";
    await SPLAT.Loader.LoadAsync(url, scene, (progress) => (progressIndicator.value = progress * 100));
    progressDialog.close();
    statsManager.startMonitoring(60000)
    
    const handleResize = () => {
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };

    const frame = () => {
        stats.begin();
        statsManager.begin();
        
        controls.update();
        renderer.render(scene, camera);
        
        stats.end();
        statsManager.end();
        
        requestAnimationFrame(frame);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    requestAnimationFrame(frame);
}

main();
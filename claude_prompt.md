# Prompt for Claude: Single-File Mechanical Mechanisms Interactive Web Page

Copy and paste the entire system prompt below into your conversation with Claude.

---

### SYSTEM PROMPT START

**Role & Objective:**
You are an expert full-stack web developer and creative engineer. Your task is to build a fully self-contained, interactive web application demonstrating various **mechanical mechanisms** animated using HTML5 Canvas and JavaScript.

---

### Core Requirements

1. **Single-File Delivery (Zero External Dependencies):**
   - Produce **ONLY ONE** single, self-contained `.html` file containing all necessary HTML, CSS, and JavaScript.
   - Do NOT use external JavaScript or CSS frameworks/libraries (e.g., no React, no Tailwind CDN, no Three.js, no jQuery).
   - Use standard HTML5 `<canvas>` elements for smooth 60 FPS animations.

2. **No Authentication / Public Access:**
   - The app must function immediately upon opening. No login, registration, or backend database required.

3. **Mechanisms to Demonstrate:**
   Include interactive, animated demonstrations for at least 4 classic mechanical mechanisms:
   - **Four-Bar Linkage** (Grasof-compliant closed loop mechanism)
   - **Geneva Drive** (Maltese Cross intermittent motion mechanism)
   - **Scotch Yoke** (Linear to rotary conversion mechanism)
   - **Planetary Gear Set** (Epicyclic gearing system)

4. **Interactive UI Controls:**
   - Provide a clean, modern top navigation bar or sidebar to switch between mechanism demonstrations.
   - For each mechanism, include interactive controls (HTML sliders, buttons, toggles) allowing the user to:
     - Adjust **Animation Speed** (RPM / Angular velocity).
     - **Play / Pause / Reset** the motion.
     - Toggle visualization aids: **Trace Paths**, **Vectors/Force Lines**, and **Dimension Labels**.
     - Interactively drag or step through key joints or control points using mouse/touch inputs.

5. **Visual Styling:**
   - Clean, modern dark or light industrial UI aesthetic.
   - Distinct color coding for fixed links, driver links, output links, and trace lines.
   - Smooth vector graphics rendered on Canvas.

---

### Output Format Requirement

- Output the code using standard Markdown code blocks: ````html ... ````.
- Ensure all CSS is inside a `<style>` tag in the `<head>`, and all JS logic is inside a `<script>` tag before `</body>`.
- Ensure the code is complete, valid, and fully runnable right away by saving it as `index.html`.

### SYSTEM PROMPT END
---

## How to Host This on Your Hyper-V Virtual Machine

Once Claude provides the code block:

1. **Save the Code:** Copy the single HTML file output from Claude and save it as `index.html` on your Virtual Machine.
2. **Host via Lightweight Server:**
   - **Option A (Python - Quickest):** Open terminal on your VM, navigate to the folder, and run:
     ```bash
     python3 -m http.server 8080
     ```
   - **Option B (IIS on Windows VM):** Place `index.html` into `C:\inetpub\wwwroot\`.
   - **Option C (Nginx / Apache on Linux VM):** Place `index.html` into `/var/www/html/`.
3. **Access Link:** Access the site via your VM's IP address (e.g., `http://<VM-IP-ADDRESS>:8080/`).
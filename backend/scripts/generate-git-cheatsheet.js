const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
} = require("docx");
const fs = require("fs");
const path = require("path");

// Colors
const PRIMARY = "1E3A8A"; // Deep Blue
const SECONDARY = "2563EB"; // Royal Blue
const ACCENT = "D97706"; // Amber / Warning
const TEXT_DARK = "0F172A"; // Slate 900
const TEXT_MUTED = "475569"; // Slate 600
const BG_LIGHT = "F8FAFC"; // Slate 50
const BG_CODE = "F1F5F9"; // Slate 100
const BORDER_COLOR = "CBD5E1"; // Slate 300
const SUCCESS_COLOR = "166534"; // Green

// Borders
const thinBorder = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: BORDER_COLOR,
};

const cellBorders = {
  top: thinBorder,
  bottom: thinBorder,
  left: thinBorder,
  right: thinBorder,
};

const calloutBorder = {
  top: { style: BorderStyle.NONE },
  bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.SINGLE, size: 24, color: ACCENT },
  right: { style: BorderStyle.NONE },
};

function createHeader(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    text: text,
    heading: level,
    spacing: { before: 280, after: 120 },
  });
}

function createParagraph(text, options = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 100 },
    ...options,
    children: [
      new TextRun({
        text,
        size: 22, // 11pt
        font: "Calibri",
        color: options.color || TEXT_DARK,
        ...options.runOptions,
      }),
    ],
  });
}

function createCodeBlock(code) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: thinBorder,
      bottom: thinBorder,
      left: { style: BorderStyle.SINGLE, size: 18, color: SECONDARY },
      right: thinBorder,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: BG_CODE, type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: code,
                    font: "Consolas",
                    size: 20, // 10pt
                    color: "0F172A",
                    bold: true,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createHintBox(title, hintText) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: calloutBorder,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "FFFBEB", type: ShadingType.CLEAR }, // Light amber
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 40 },
                children: [
                  new TextRun({
                    text: "💡 HINT / WHAT TO LOOK FOR: ",
                    font: "Calibri",
                    size: 20,
                    bold: true,
                    color: ACCENT,
                  }),
                  new TextRun({
                    text: title,
                    font: "Calibri",
                    size: 20,
                    bold: true,
                    color: TEXT_DARK,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: hintText,
                    font: "Calibri",
                    size: 20,
                    color: TEXT_MUTED,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createCommandCard(command, purpose, explanation, hintTitle, hintText) {
  return [
    new Paragraph({
      spacing: { before: 200, after: 60 },
      children: [
        new TextRun({
          text: command,
          font: "Consolas",
          size: 22,
          bold: true,
          color: PRIMARY,
        }),
        new TextRun({
          text: `  —  ${purpose}`,
          font: "Calibri",
          size: 22,
          color: TEXT_MUTED,
          italics: true,
        }),
      ],
    }),
    createParagraph(explanation),
    createHintBox(hintTitle, hintText),
    new Paragraph({ spacing: { before: 80, after: 80 } }),
  ];
}

async function buildDoc() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 22,
            color: TEXT_DARK,
          },
        },
      },
      heading1: {
        run: {
          font: "Calibri",
          size: 32, // 16pt
          bold: true,
          color: PRIMARY,
        },
        paragraph: {
          spacing: { before: 320, after: 120 },
        },
      },
      heading2: {
        run: {
          font: "Calibri",
          size: 26, // 13pt
          bold: true,
          color: SECONDARY,
        },
        paragraph: {
          spacing: { before: 240, after: 80 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1200,
              right: 1200,
            },
          },
        },
        children: [
          // Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 80 },
            children: [
              new TextRun({
                text: "SmartSakay Dagupan",
                font: "Calibri",
                size: 24,
                color: SECONDARY,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 120 },
            children: [
              new TextRun({
                text: "Complete Git Commands & Workflow Cheatsheet",
                font: "Calibri",
                size: 44, // 22pt
                bold: true,
                color: PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 300 },
            children: [
              new TextRun({
                text: "Practical Developer Guide • Step-by-Step Explanations • Real Hints & Troubleshooting",
                font: "Calibri",
                size: 20,
                italics: true,
                color: TEXT_MUTED,
              }),
            ],
          }),

          // Visual Diagram / Mental Model
          createHeader("1. The Git Mental Model (How Git Actually Works)", HeadingLevel.HEADING_1),
          createParagraph(
            "Every Git workflow involves four primary zones. Understanding these four areas eliminates 99% of Git confusion:"
          ),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: "DBEAFE", type: ShadingType.CLEAR },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Zone", bold: true, color: PRIMARY, size: 20 }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    shading: { fill: "DBEAFE", type: ShadingType.CLEAR },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "What It Is", bold: true, color: PRIMARY, size: 20 }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    shading: { fill: "DBEAFE", type: ShadingType.CLEAR },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Command to Move Here", bold: true, color: PRIMARY, size: 20 }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "1. Working Directory", bold: true, size: 20 })] }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "Your actual files in VS Code / folder where you make edits.", size: 20 })] }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "Simply edit & save files", font: "Consolas", size: 18 })] }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "2. Staging Area (Index)", bold: true, size: 20 })] }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "The prep box where you pack files you want to include in your next snapshot.", size: 20 })] }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "git add <file> or git add .", font: "Consolas", size: 18 })] }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "3. Local Repository", bold: true, size: 20 })] }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "Permanent saved snapshots (commits) recorded on your local computer.", size: 20 })] }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: 'git commit -m "Message"', font: "Consolas", size: 18 })] }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "4. Remote Repository (GitHub)", bold: true, size: 20 })] }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "The cloud repository on GitHub shared with your team and backup.", size: 20 })] }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "git push origin main", font: "Consolas", size: 18 })] }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Section 2: Daily Workflow
          createHeader("2. Daily Workflow Commands (The 5 Core Steps)", HeadingLevel.HEADING_1),
          createParagraph(
            "Whenever you complete a feature or fix a bug, you follow this exact cycle in order:"
          ),

          ...createCommandCard(
            "Step 1: git status",
            "Check what changed",
            "Inspects your working directory and staging area. Shows untracked files, modified files, and what branch you are on.",
            "Color Coding & Branch Status",
            "• RED files = Changed but not staged yet.\n• GREEN files = Staged and ready to commit.\n• 'Your branch is ahead by X commits' = You committed locally, but still need to run 'git push'.\n• 'Your branch is behind by X commits' = Remote has new work, run 'git pull origin main'.\n• 'nothing to commit, working tree clean' = Everything is saved and synchronized!"
          ),

          ...createCommandCard(
            "Step 2: git add .  (or git add <file>)",
            "Stage your changes",
            "Gathers all modified or new files into the staging area. Use 'git add .' to stage all files in the current folder, or name a specific file like 'git add server.js'.",
            "What to verify right after",
            "Always run 'git status' immediately after 'git add .'. Check that sensitive files (like .env, secrets, or node_modules) did NOT turn green. If you staged a file by accident, run 'git restore --staged <file>' to unstage it safely."
          ),

          ...createCommandCard(
            'Step 3: git commit -m "Description of changes"',
            "Save snapshot locally",
            "Locks your staged changes into a permanent commit in your local Git database.",
            "Write Clear Messages & Avoid Vim Lockup",
            "• Always include the -m flag with double quotes. If you forget -m, Git will open the Vim text editor! (If you get stuck in Vim, press Escape, then type :q! and hit Enter).\n• Use descriptive present-tense messages: 'Fix login button routing' rather than 'fix' or 'update'."
          ),

          ...createCommandCard(
            "Step 4: git push origin main",
            "Upload local commits to GitHub",
            "Sends all your locally committed snapshots up to your GitHub repository on the 'main' branch.",
            "If Git Rejects Your Push",
            "If you see: '[rejected - non-fast-forward]': It means someone updated GitHub while you were working. You MUST run 'git pull origin main' first, resolve any conflicts, and then push again."
          ),

          ...createCommandCard(
            "Step 5: git pull origin main",
            "Download latest commits from GitHub",
            "Fetches updates from GitHub and immediately merges them into your local branch.",
            "Prevent Overwrite Conflicts",
            "If you have unsaved local edits, Git will prevent a pull to protect your work. Always run 'git status' first. Either commit your changes, or run 'git stash' before pulling, then 'git stash pop' after."
          ),

          // Section 3: Inspecting & Comparing
          createHeader("3. Viewing History & Comparing Code", HeadingLevel.HEADING_1),

          ...createCommandCard(
            "git log --oneline -5",
            "View recent commit history",
            "Displays the last 5 commits in a clean, compact one-line format showing the commit hash ID and message.",
            "Exiting Git Log",
            "If git log opens a scrollable terminal with a colon (:), press the 'q' key on your keyboard to instantly return to your normal command prompt."
          ),

          ...createCommandCard(
            "git diff",
            "View unstaged code changes",
            "Shows exactly which lines were added (+ green) or removed (- red) in your files before you run 'git add'.",
            "Differentiating Staged vs Unstaged",
            "• 'git diff' shows changes you haven't staged yet.\n• 'git diff --staged' shows changes you already added to staging area waiting to commit."
          ),

          ...createCommandCard(
            "git remote -v",
            "Check connected GitHub repositories",
            "Displays the remote URLs for fetch and push connected to your local repo (e.g. https://github.com/Russel-git/smartsakaydagupan.git).",
            "Verifying Your Destination",
            "Use this if you are unsure which GitHub account or repository URL your code is uploading to."
          ),

          // Section 4: Undoing Mistakes Safely
          createHeader("4. Undoing Mistakes (The Panic Button Reference)", HeadingLevel.HEADING_1),

          ...createCommandCard(
            "git restore <file>",
            "Discard uncommitted changes in a file",
            "Discards all edits made to a file since your last commit and reverts it back to its saved state.",
            "Caution: Permanent",
            "This deletes unsaved work in that specific file! Only use this when you made unwanted changes and want to reset the file completely."
          ),

          ...createCommandCard(
            "git restore --staged <file>",
            "Unstage a file you added by accident",
            "Removes a file from the staging area without deleting your code changes. The file turns back to red in git status.",
            "Safe Undo",
            "Use this whenever you accidentally ran 'git add .' and realized you included a file you didn't want to commit."
          ),

          ...createCommandCard(
            "git reset --soft HEAD~1",
            "Undo the last commit (keep your code!)",
            "Rewinds the last commit snapshot. All your files remain intact in the staging area ready to re-commit with a new message or extra files.",
            "Never use --hard unless you want to delete everything",
            "• '--soft' safely undoes the commit and preserves all your code.\n• '--hard' deletes your code changes completely back to the previous commit. Avoid '--hard' unless you truly want to wipe everything."
          ),

          ...createCommandCard(
            "git stash  &  git stash pop",
            "Temporarily hide away work in progress",
            "'git stash' takes all your uncommitted edits, wipes your working tree clean, and stores your changes on a hidden shelf. 'git stash pop' brings them back.",
            "When to use this",
            "Perfect when you want to pull updates from GitHub or switch branches, but your current task is half-finished and not ready to commit."
          ),

          // Section 5: Working with Branches
          createHeader("5. Working with Branches", HeadingLevel.HEADING_1),

          ...createCommandCard(
            "git branch",
            "List all local branches",
            "Shows all branches created on your computer. An asterisk (*) next to a branch name indicates the branch you are currently working on.",
            "Knowing Where You Are",
            "Always check branch before committing. Committing to 'main' directly is fine for solo projects, but feature branches are recommended for big upgrades."
          ),

          ...createCommandCard(
            "git checkout -b <branch-name>",
            "Create & switch to a new branch",
            "Creates an isolated workspace copy where you can test features without affecting your main production code.",
            "Example",
            "git checkout -b feature/weather-alerts\n(You can also use the modern syntax: git switch -c feature/weather-alerts)"
          ),

          ...createCommandCard(
            "git checkout main  (or git switch main)",
            "Switch back to main branch",
            "Switches your active directory back to the main branch.",
            "Uncommitted Changes Warning",
            "Make sure your working directory is clean before switching branches (either commit or stash first)."
          ),

          ...createCommandCard(
            "git merge <feature-branch>",
            "Merge feature branch into current branch",
            "Combines changes from your feature branch into your active branch.",
            "The Safe Merge Recipe",
            "1. Switch to the target branch: git checkout main\n2. Pull latest: git pull origin main\n3. Merge your feature: git merge feature/my-feature\n4. Push the result: git push origin main"
          ),

          // Section 6: Golden Rules
          createHeader("6. Golden Rules for Never Breaking Git", HeadingLevel.HEADING_1),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "Rule #", bold: true, size: 20 })] })],
                  }),
                  new TableCell({
                    shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "Golden Rule", bold: true, size: 20 })] })],
                  }),
                  new TableCell({
                    shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "Why It Protects You", bold: true, size: 20 })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "1", bold: true, size: 20 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Run 'git status' before & after every command", bold: true, size: 20 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Eliminates surprises. You will always know what branch you are on and what files are about to be saved.", size: 20 })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "2", bold: true, size: 20 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Never commit .env files", bold: true, size: 20 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "API keys, DB passwords, and secrets must stay local. Ensure .env is always listed in .gitignore.", size: 20 })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "3", bold: true, size: 20 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Pull before you start coding", bold: true, size: 20 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Running 'git pull origin main' when starting work ensures you always build on the newest codebase, avoiding merge conflicts.", size: 20 })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "4", bold: true, size: 20 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Commit small, commit often", bold: true, size: 20 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "One commit per feature or bugfix is much easier to review, debug, or revert than one gigantic commit with 50 files.", size: 20 })] })] }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 240, after: 60 } }),
          createHintBox(
            "QUICK COPY-PASTE CHEAT SHEET",
            "Everyday Push Sequence:\n  git status\n  git add .\n  git commit -m \"Your message\"\n  git push origin main\n\nEveryday Pull Sequence:\n  git status\n  git pull origin main"
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.resolve(__dirname, "../../Git_Commands_Cheatsheet.docx");
  fs.writeFileSync(outputPath, buffer);
  console.log(`Document created successfully at: ${outputPath}`);
}

buildDoc().catch((err) => {
  console.error("Error generating docx:", err);
  process.exit(1);
});

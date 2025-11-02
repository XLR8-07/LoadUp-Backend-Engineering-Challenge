/**
 * Database Seed Script
 * Populates the database with sample jobs and applications for testing
 */

const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");

// Load environment variables
require("dotenv").config();

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    database: process.env.DB_NAME || "job_application_service",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres"
});

// Sample Jobs
const jobs = [
    {
        id: uuidv4(),
        title: "Senior Data Engineer",
        location: "Remote",
        customer: "LoadUp Inc.",
        jobName: "senior-data-engineer-remote",
        description: "Build and maintain scalable data pipelines for processing millions of records daily. Work with cutting-edge tools in the data ecosystem.",
        questions: [
            {
                id: "q1",
                text: "What is your primary programming language for data engineering?",
                type: "single_choice",
                options: ["Python", "Scala", "Java", "Go"],
                scoring: {
                    kind: "single_choice",
                    maxPoints: 10,
                    correctOption: "Python"
                }
            },
            {
                id: "q2",
                text: "Which data orchestration tools are you proficient with?",
                type: "multi_choice",
                options: ["Airflow", "Prefect", "Dagster", "Luigi", "Argo"],
                scoring: {
                    kind: "multi_choice",
                    maxPoints: 15,
                    correctOptions: ["Airflow", "Prefect"],
                    penalizeExtras: true
                }
            },
            {
                id: "q3",
                text: "How many years of professional data engineering experience do you have?",
                type: "number",
                scoring: {
                    kind: "number",
                    maxPoints: 10,
                    min: 5,
                    max: 15
                }
            },
            {
                id: "q4",
                text: "Describe your experience with data pipeline design and ETL processes.",
                type: "text",
                scoring: {
                    kind: "text",
                    maxPoints: 20,
                    keywords: ["ETL", "pipeline", "data warehouse", "streaming", "batch processing"],
                    minimumMatchRatio: 0.4
                }
            },
            {
                id: "q5",
                text: "Which cloud platforms have you worked with?",
                type: "multi_choice",
                options: ["AWS", "Azure", "GCP", "DigitalOcean"],
                scoring: {
                    kind: "multi_choice",
                    maxPoints: 10,
                    correctOptions: ["AWS", "GCP"],
                    penalizeExtras: false
                }
            }
        ],
        createdAt: new Date().toISOString()
    },
    {
        id: uuidv4(),
        title: "Frontend Developer",
        location: "San Francisco, CA",
        customer: "TechCorp",
        jobName: "frontend-developer-sf",
        description: "Join our team to build beautiful, responsive user interfaces using modern web technologies.",
        questions: [
            {
                id: "q1",
                text: "What is your preferred frontend framework?",
                type: "single_choice",
                options: ["React", "Vue", "Angular", "Svelte"],
                scoring: {
                    kind: "single_choice",
                    maxPoints: 10,
                    correctOption: "React"
                }
            },
            {
                id: "q2",
                text: "Which state management solutions have you used?",
                type: "multi_choice",
                options: ["Redux", "MobX", "Zustand", "Recoil", "Context API"],
                scoring: {
                    kind: "multi_choice",
                    maxPoints: 15,
                    correctOptions: ["Redux", "Zustand"],
                    penalizeExtras: false
                }
            },
            {
                id: "q3",
                text: "Years of React experience?",
                type: "number",
                scoring: {
                    kind: "number",
                    maxPoints: 10,
                    min: 3,
                    max: 10
                }
            },
            {
                id: "q4",
                text: "Describe your approach to building accessible and performant web applications.",
                type: "text",
                scoring: {
                    kind: "text",
                    maxPoints: 15,
                    keywords: ["accessibility", "performance", "optimization", "responsive", "user experience"],
                    minimumMatchRatio: 0.3
                }
            }
        ],
        createdAt: new Date().toISOString()
    },
    {
        id: uuidv4(),
        title: "DevOps Engineer",
        location: "New York, NY",
        customer: "CloudScale",
        jobName: "devops-engineer-ny",
        description: "Maintain and improve our cloud infrastructure, CI/CD pipelines, and monitoring systems.",
        questions: [
            {
                id: "q1",
                text: "What is your primary container orchestration platform?",
                type: "single_choice",
                options: ["Kubernetes", "Docker Swarm", "ECS", "Nomad"],
                scoring: {
                    kind: "single_choice",
                    maxPoints: 15,
                    correctOption: "Kubernetes"
                }
            },
            {
                id: "q2",
                text: "Which Infrastructure as Code tools do you use?",
                type: "multi_choice",
                options: ["Terraform", "CloudFormation", "Pulumi", "Ansible", "Chef"],
                scoring: {
                    kind: "multi_choice",
                    maxPoints: 20,
                    correctOptions: ["Terraform", "Ansible"],
                    penalizeExtras: true
                }
            },
            {
                id: "q3",
                text: "Years of DevOps experience?",
                type: "number",
                scoring: {
                    kind: "number",
                    maxPoints: 10,
                    min: 4,
                    max: 12
                }
            },
            {
                id: "q4",
                text: "Explain your experience with CI/CD pipelines and deployment strategies.",
                type: "text",
                scoring: {
                    kind: "text",
                    maxPoints: 15,
                    keywords: ["CI/CD", "deployment", "automation", "monitoring", "Jenkins", "GitLab"],
                    minimumMatchRatio: 0.33
                }
            }
        ],
        createdAt: new Date().toISOString()
    }
];

// Sample Applications for each job
function generateApplications(jobId, jobQuestions) {
    const applications = [];

    // Perfect candidate
    applications.push({
        id: uuidv4(),
        jobId,
        candidateName: "Alice Johnson",
        candidateEmail: "alice.johnson@example.com",
        answers: jobQuestions.map(q => {
            if (q.scoring.kind === "single_choice") {
                return { questionId: q.id, answer: q.scoring.correctOption };
            } else if (q.scoring.kind === "multi_choice") {
                return { questionId: q.id, answer: q.scoring.correctOptions };
            } else if (q.scoring.kind === "number") {
                return { questionId: q.id, answer: q.scoring.min + 2 };
            } else {
                return {
                    questionId: q.id,
                    answer: `I have extensive experience with ${q.scoring.keywords.join(", ")}. I've worked on multiple projects involving these technologies.`
                };
            }
        }),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
    });

    // Good candidate with some gaps
    applications.push({
        id: uuidv4(),
        jobId,
        candidateName: "Bob Smith",
        candidateEmail: "bob.smith@example.com",
        answers: jobQuestions.map((q, idx) => {
            if (q.scoring.kind === "single_choice") {
                return { questionId: q.id, answer: idx === 0 ? q.scoring.correctOption : q.options[1] };
            } else if (q.scoring.kind === "multi_choice") {
                return { questionId: q.id, answer: [q.scoring.correctOptions[0]] };
            } else if (q.scoring.kind === "number") {
                return { questionId: q.id, answer: q.scoring.min };
            } else {
                const keywords = q.scoring.keywords.slice(0, 2);
                return {
                    questionId: q.id,
                    answer: `I have worked with ${keywords.join(" and ")} in my previous roles.`
                };
            }
        }),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() // 12 hours ago
    });

    // Average candidate
    applications.push({
        id: uuidv4(),
        jobId,
        candidateName: "Carol Williams",
        candidateEmail: "carol.williams@example.com",
        answers: jobQuestions.map((q, idx) => {
            if (q.scoring.kind === "single_choice") {
                return { questionId: q.id, answer: q.options[idx % q.options.length] };
            } else if (q.scoring.kind === "multi_choice") {
                const options = idx === 0 ? q.scoring.correctOptions : [q.options[0], q.options[q.options.length - 1]];
                return { questionId: q.id, answer: options };
            } else if (q.scoring.kind === "number") {
                return { questionId: q.id, answer: q.scoring.min - 1 }; // Out of range
            } else {
                return {
                    questionId: q.id,
                    answer: "I have some experience with these technologies."
                };
            }
        }),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() // 6 hours ago
    });

    // Weak candidate with many wrong answers
    applications.push({
        id: uuidv4(),
        jobId,
        candidateName: "David Brown",
        candidateEmail: "david.brown@example.com",
        answers: jobQuestions.slice(0, Math.max(1, jobQuestions.length - 1)).map((q, idx) => {
            if (q.scoring.kind === "single_choice") {
                const wrongOptions = q.options.filter(opt => opt !== q.scoring.correctOption);
                return { questionId: q.id, answer: wrongOptions[0] || q.options[0] };
            } else if (q.scoring.kind === "multi_choice") {
                const wrongOptions = q.options.filter(opt => !q.scoring.correctOptions.includes(opt));
                return { questionId: q.id, answer: wrongOptions.slice(0, 2) };
            } else if (q.scoring.kind === "number") {
                return { questionId: q.id, answer: q.scoring.max + 10 }; // Way out of range
            } else {
                return {
                    questionId: q.id,
                    answer: "I'm a quick learner and eager to develop these skills."
                };
            }
        }),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
    });

    // Incomplete application (missing some answers)
    applications.push({
        id: uuidv4(),
        jobId,
        candidateName: "Eve Martinez",
        candidateEmail: "eve.martinez@example.com",
        answers: jobQuestions.slice(0, 2).map(q => {
            if (q.scoring.kind === "single_choice") {
                return { questionId: q.id, answer: q.scoring.correctOption };
            } else if (q.scoring.kind === "multi_choice") {
                return { questionId: q.id, answer: q.scoring.correctOptions };
            } else {
                return { questionId: q.id, answer: q.scoring.min };
            }
        }),
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
    });

    return applications;
}

// Score calculation function (mirrors the backend logic)
function calculateScore(job, answers) {
    let total = 0;
    let maxTotal = 0;
    const perQuestion = [];

    for (const question of job.questions) {
        const answerObj = answers.find(a => a.questionId === question.id);
        maxTotal += question.scoring.maxPoints;

        if (!answerObj) {
            perQuestion.push({
                questionId: question.id,
                awarded: 0,
                max: question.scoring.maxPoints,
                reason: "No answer provided"
            });
            continue;
        }

        let awarded = 0;
        let reason = "";

        switch (question.scoring.kind) {
            case "single_choice":
                if (answerObj.answer === question.scoring.correctOption) {
                    awarded = question.scoring.maxPoints;
                    reason = "Matched correct option";
                } else {
                    awarded = 0;
                    reason = `Selected "${answerObj.answer}" but correct option is "${question.scoring.correctOption}"`;
                }
                break;

            case "multi_choice":
                const matches = answerObj.answer.filter(a => question.scoring.correctOptions.includes(a)).length;
                const hasExtras = answerObj.answer.some(a => !question.scoring.correctOptions.includes(a));
                awarded = (matches / question.scoring.correctOptions.length) * question.scoring.maxPoints;
                if (hasExtras && question.scoring.penalizeExtras) {
                    awarded *= 0.8;
                    reason = `Matched ${matches}/${question.scoring.correctOptions.length} correct options (penalty applied for extra selections)`;
                } else {
                    reason = `Matched ${matches}/${question.scoring.correctOptions.length} correct options`;
                }
                awarded = Math.round(awarded * 100) / 100;
                break;

            case "number":
                if (answerObj.answer >= question.scoring.min && answerObj.answer <= question.scoring.max) {
                    awarded = question.scoring.maxPoints;
                    reason = `Number within range [${question.scoring.min}, ${question.scoring.max}]`;
                } else {
                    awarded = 0;
                    reason = `Number ${answerObj.answer} is out of range [${question.scoring.min}, ${question.scoring.max}]`;
                }
                break;

            case "text":
                const answerLower = answerObj.answer.toLowerCase();
                const matchedKeywords = question.scoring.keywords.filter(kw =>
                    answerLower.includes(kw.toLowerCase())
                );
                const matchRatio = matchedKeywords.length / question.scoring.keywords.length;

                if (question.scoring.minimumMatchRatio && matchRatio < question.scoring.minimumMatchRatio) {
                    awarded = 0;
                    reason = `Matched ${matchedKeywords.length}/${question.scoring.keywords.length} keywords but below minimum ratio`;
                } else {
                    awarded = matchRatio * question.scoring.maxPoints;
                    awarded = Math.round(awarded * 100) / 100;
                    reason = matchedKeywords.length > 0
                        ? `Matched ${matchedKeywords.length}/${question.scoring.keywords.length} keywords: ${matchedKeywords.join(", ")}`
                        : `Matched 0/${question.scoring.keywords.length} keywords`;
                }
                break;
        }

        perQuestion.push({
            questionId: question.id,
            awarded,
            max: question.scoring.maxPoints,
            reason
        });

        total += awarded;
    }

    return {
        total: Math.round(total * 100) / 100,
        maxTotal,
        perQuestion
    };
}

async function seed() {
    const client = await pool.connect();

    try {
        console.log("Starting database seed...");

        // Clear existing data first to avoid foreign key conflicts
        console.log("\nClearing existing data...");
        await client.query("DELETE FROM applications");
        await client.query("DELETE FROM jobs");
        console.log("  ✓ Existing data cleared");

        // Insert jobs
        console.log(`\nInserting ${jobs.length} jobs...`);
        for (const job of jobs) {
            const query = `
        INSERT INTO jobs (id, title, location, customer, job_name, description, questions, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (job_name) DO NOTHING
      `;

            await client.query(query, [
                job.id,
                job.title,
                job.location,
                job.customer,
                job.jobName,
                job.description,
                JSON.stringify(job.questions),
                job.createdAt
            ]);

            console.log(`  ✓ ${job.title} (${job.jobName})`);

            // Generate and insert applications for this job
            const applications = generateApplications(job.id, job.questions);

            console.log(`    Inserting ${applications.length} applications...`);
            for (const app of applications) {
                const score = calculateScore(job, app.answers);

                const appQuery = `
          INSERT INTO applications (id, job_id, candidate_name, candidate_email, answers, score, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

                await client.query(appQuery, [
                    app.id,
                    app.jobId,
                    app.candidateName,
                    app.candidateEmail,
                    JSON.stringify(app.answers),
                    JSON.stringify(score),
                    app.createdAt
                ]);

                console.log(`      ✓ ${app.candidateName} - Score: ${score.total}/${score.maxTotal}`);
            }
        }

        console.log("\n✅ Database seeded successfully!");
        console.log(`\nSummary:`);
        console.log(`  - Jobs created: ${jobs.length}`);
        console.log(`  - Applications per job: 5`);
        console.log(`  - Total applications: ${jobs.length * 5}`);

    } catch (error) {
        console.error("\n❌ Error seeding database:", error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the seed
seed().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
});


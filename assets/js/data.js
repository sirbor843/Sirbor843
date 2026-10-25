'use strict';

/*
 * Site content. Edit this file to update projects, experience, skills,
 * writing and architectures — the page renders from it.
 */

window.SITE = {
  profile: {
    name: 'Dominic Bor',
    handle: 'sirbor843',
    role: 'Data & ML Systems Engineer',
    email: 'dominicbor44@gmail.com',
    website: 'https://kdbor.engineer',
    location: 'New York, NY',
    timezone: 'America/New_York',
    // Cal.com public event type the on-site booker reads and books
    cal: {
      username: 'sirbor843',
      event: 'meeting',
      url: 'https://cal.com/sirbor843/meeting'
    },
    github: 'https://github.com/sirbor843',
    linkedin: 'https://www.linkedin.com/in/sirbor843/',
    twitter: 'https://twitter.com/sirbor843',
    goodreads: 'https://www.goodreads.com/sirbor843',
    careerStart: '2022-01-01'
  },

  roles: [
    'real-time payment layers',
    'event streaming pipelines',
    'production ML systems',
    'LLM & agentic workflows',
    'cloud infra that costs less'
  ],

  experience: [
    {
      company: 'Labs Afrika',
      title: 'Data Engineer',
      domain: 'Fintech · Payments',
      location: 'Nairobi, Kenya',
      start: 'Mar 2025',
      end: 'Present',
      stack: ['Go', 'Redis', 'Stripe', 'M-Pesa', 'Python', 'Kafka', 'AWS Lambda', 'Docker', 'PostgreSQL'],
      bullets: [
        'Partnered directly with merchants to clarify messy edge cases and transaction flows, integrating Stripe and M-Pesa into a high-availability Go payment layer.',
        'Cut validation and serving latency by over 50% through streamlined Redis caching, efficient load distribution, and targeted service profiling.',
        'Built real-time customer behavior pipelines using Python and Kafka to surface billing anomalies early, flag churn risks, and drive product improvements.',
        'Reduced cloud infrastructure spending by over 35% by migrating batch workloads to containerized AWS Lambda and Docker architectures scaling on demand.',
        'Designed robust PostgreSQL audit trails and data validation checks, halving reconciliation discrepancies while keeping tracking clean and reproducible.',
        'Maintained a rapid shipping cadence, moving from PRDs and Linear tickets to tested, production-grade features using modern AI tooling.'
      ]
    },
    {
      company: 'Rapid Research',
      title: 'Data Engineer',
      domain: 'Gaming · Casino',
      location: 'Remote',
      start: 'Nov 2023',
      end: 'Feb 2025',
      stack: ['AWS Glue', 'PySpark', 'Python', 'FastAPI', 'Docker', 'Airflow'],
      bullets: [
        'Built high-throughput ETL pipelines with AWS Glue and PySpark, transforming millions of daily gaming events into structured feature sets for model evals.',
        'Shipped real-time churn and lifetime value models using Python, FastAPI, and Docker, delivering high-freshness predictive signals directly to operational teams.',
        'Automated workflow validation and alerting in Apache Airflow, catching silent pipeline regressions in minutes rather than hours.',
        'Collaborated with non-technical stakeholders to test core assumptions, clarify product requirements, and turn analytical findings into production features.'
      ]
    },
    {
      company: 'TechFlow Solutions',
      title: 'Junior Data Engineer',
      domain: 'Health Systems',
      location: 'Nairobi, Kenya',
      start: 'Jan 2022',
      end: 'Oct 2023',
      stack: ['Python', 'AWS S3', 'SQL', 'Redshift', 'Snowflake'],
      bullets: [
        'Automated healthcare data reconciliation in Python, saving dozens of engineering hours weekly and eliminating manual spreadsheet errors.',
        'Migrated hundreds of gigabytes of clinical data to AWS S3, implementing strict schema validation to guarantee end-to-end data integrity.',
        'Built reliable SQL pipelines across Redshift and Snowflake, turning raw, unstructured logs into clean operational datasets and dashboards.'
      ]
    }
  ],

  education: [
    {
      name: 'KCA University',
      detail: 'BSc Information Technology',
      text: 'Academic foundation in software systems, database architecture, network infrastructure, and computer science methodologies.'
    },
    {
      name: 'ALX Software Engineering',
      detail: 'Backend Systems & Software Engineering',
      text: 'Low-level systems programming in C, Unix internals, memory management, distributed backend architectures, and DevOps automation.'
    },
    {
      name: 'GitHub Campus Expert',
      detail: 'Technical Community Leader',
      text: 'Selected and trained by GitHub to lead workshops on Git workflows, open-source practices, and CI/CD with GitHub Actions.'
    }
  ],

  skills: [
    { group: 'Languages', items: ['Python', 'Go', 'TypeScript', 'SQL', 'C', 'Swift', 'Kotlin', 'Dart'] },
    { group: 'Data & Streaming', items: ['Kafka', 'PySpark', 'AWS Glue', 'Airflow', 'Pandas', 'GeoPandas', 'Snowflake', 'Redshift'] },
    { group: 'Storage', items: ['PostgreSQL', 'PostGIS', 'Redis', 'AWS S3'] },
    { group: 'ML & AI', items: ['scikit-learn', 'PyTorch', 'FastAPI', 'LLM APIs', 'RAG', 'Agents'] },
    { group: 'Cloud & DevOps', items: ['AWS Lambda', 'Docker', 'GitHub Actions', 'Linux', 'POSIX'] },
    { group: 'Payments', items: ['Stripe', 'M-Pesa'] },
    { group: 'Apps', items: ['SwiftUI', 'Flutter', 'Tableau'] }
  ],

  projects: [
    {
      id: 'payments',
      title: 'High-Availability Payment System',
      category: 'systems',
      image: 'project-finje.png',
      stack: ['Go', 'Redis', 'Stripe', 'M-Pesa'],
      summary: 'Low-latency payment validation and settlement across card and mobile-money rails.',
      highlights: [
        'Unified Stripe and M-Pesa behind a single Go service interface.',
        'Redis caching and idempotent webhook handling for safe retries.',
        'Designed for sub-second validation on the hot path.'
      ],
      // production work at Labs Afrika: no public repo
      repo: null,
      privateNote: 'Production work at Labs Afrika; the code is private.',
      featured: true
    },
    {
      id: 'gaming-etl',
      title: 'Gaming Event ETL & Predictive Models',
      category: 'data',
      cover: [
        '# glue job: sessionize raw events',
        'events = spark.read.parquet(raw_path)',
        'features = (events',
        '  .groupBy("player_id", window("ts", "1 day"))',
        '  .agg(count("*").alias("sessions"),',
        '       sum("stake").alias("stake")))',
        'features.write.partitionBy("dt").parquet(out)'
      ],
      stack: ['AWS Glue', 'PySpark', 'FastAPI', 'Docker'],
      summary: 'High-throughput telemetry pipelines feeding real-time churn and LTV models.',
      highlights: [
        'Glue + PySpark jobs turning millions of daily events into feature sets.',
        'Churn and lifetime-value models served from containerized FastAPI.',
        'Fresh predictive signals delivered straight to operational teams.'
      ],
      repo: 'https://github.com/sirbor843',
      featured: true
    },
    {
      id: 'gis',
      title: 'Property GIS Land Valuation',
      category: 'data',
      image: 'project-keja.png',
      stack: ['Python', 'GeoPandas', 'PostGIS', 'scikit-learn'],
      summary: 'Spatial valuation model turning registry and coordinate data into pricing insight.',
      highlights: [
        'Spatial feature engineering with GeoPandas and PostGIS.',
        'scikit-learn valuation model with interpretable outputs.',
        'Stakeholder-facing pricing insights rather than raw scores.'
      ],
      repo: 'https://github.com/sirbor843',
      featured: true
    },
    {
      id: 'claims',
      title: 'Health Insurance Claims Analytics',
      category: 'data',
      cover: [
        '# daily claims audit DAG',
        'with DAG("claims_audit", schedule="@daily"):',
        '    extract >> validate_schema >> load',
        '    load >> audit_totals >> refresh_dashboards'
      ],
      stack: ['Python', 'SQL', 'Airflow', 'Tableau'],
      summary: 'Automated ETL audit pipelines for claims data with reporting on top.',
      highlights: [
        'Airflow-orchestrated ETL with audit and validation steps.',
        'SQL models shaping raw claims into analysis-ready tables.',
        'Tableau dashboards for operational reporting.'
      ],
      repo: 'https://github.com/sirbor843'
    },
    {
      id: 'flights',
      title: 'Fuel Prices & Airfare Analysis',
      category: 'data',
      cover: [
        '-- fare vs fuel, by month',
        "SELECT date_trunc('month', dep_date) AS m,",
        '       avg(fare)     AS avg_fare,',
        '       avg(jet_fuel) AS avg_fuel',
        'FROM flights JOIN fuel USING (dep_date)',
        'GROUP BY 1 ORDER BY 1;'
      ],
      stack: ['Python', 'SQL', 'Pandas', 'Tableau'],
      summary: 'How fuel prices and seasonal demand shape airfare — and the budget trade-offs.',
      highlights: [
        'Data preparation and joins in SQL and Pandas.',
        'Seasonality and price-driver analysis.',
        'Tableau views of budget trade-offs for travelers.'
      ],
      repo: 'https://github.com/sirbor843/FlightsAnalysis'
    },
    {
      id: 'jikoni',
      title: 'Jikoni',
      category: 'apps',
      image: 'project-jikoni.png',
      stack: ['Swift', 'SwiftUI'],
      summary: 'iOS restaurant discovery and appointment booking app.',
      highlights: [
        'Native SwiftUI interface.',
        'Restaurant browsing and booking flows.'
      ],
      repo: 'https://github.com/sirbor843/Jikoni'
    },
    {
      id: 'astra',
      title: 'astraLauncher',
      category: 'apps',
      cover: [
        '// D-pad first: every tile is focusable',
        'FocusTraversalGroup(',
        '  policy: OrderedTraversalPolicy(),',
        '  child: AppGrid(onSelect: launchApp),',
        ')'
      ],
      stack: ['Flutter', 'Dart'],
      summary: 'Remote-first Android TV launcher built for D-pad navigation.',
      highlights: [
        'Flutter UI tuned for 10-foot, remote-control interaction.',
        'Custom launcher replacing the stock Android TV home.'
      ],
      repo: 'https://github.com/sirbor843/astraLauncher'
    },
    {
      id: 'calc',
      title: 'Command Line Calculator',
      category: 'systems',
      cover: [
        '$ ./calc "sin(pi/4) * 2^10"',
        '724.077344',
        '$ ./calc "sqrt(2) + ln(e)"',
        '2.414214'
      ],
      stack: ['C', 'POSIX', 'Linux'],
      summary: 'High-performance scientific calculator for the terminal, written in C.',
      highlights: [
        'Expression parsing and evaluation in plain C.',
        'POSIX-friendly CLI for Linux environments.'
      ],
      repo: 'https://github.com/sirbor843/Commandline_Calculator'
    }
  ],

  writing: [
    {
      title: 'Cutting Serving Latency by 50% with Redis Caching and Go Service Profiling',
      category: 'Systems & Performance',
      date: '2025-03-12',
      summary: 'Streamlining transaction validation layers, eliminating redundant round-trips, and profiling Go payment microservices.',
      url: 'https://kdbor.engineer'
    },
    {
      title: 'Building Resilient PySpark and AWS Glue Pipelines for Millions of Daily Events',
      category: 'Data Engineering',
      date: '2025-01-20',
      summary: 'Transforming massive telemetry event streams into structured feature sets for model evals and real-time operations.',
      url: 'https://kdbor.engineer'
    },
    {
      title: 'Automating Workflow Validation and Alerting in Apache Airflow',
      category: 'Data Infrastructure',
      date: '2024-10-15',
      summary: 'Catching silent pipeline regressions in minutes through custom DAG sensors, schema checks, and Slack alerts.',
      url: 'https://kdbor.engineer'
    },
    {
      title: 'Deploying Real-Time Churn and LTV Models with Python, FastAPI, and Docker',
      category: 'Machine Learning',
      date: '2024-07-10',
      summary: 'Serving high-freshness predictive signals to operational teams with low-latency containerized inference APIs.',
      url: 'https://kdbor.engineer'
    },
    {
      title: 'Building an End-to-End Spatial Valuation Model with GeoPandas and PostGIS',
      category: 'Spatial ML',
      date: '2024-05-18',
      summary: 'Converting registry and geographical coordinates into interpretable, stakeholder-facing pricing insights.',
      url: 'https://kdbor.engineer'
    },
    {
      title: 'Writing a Unix Shell from Scratch in C: Lessons in Low-Level Systems',
      category: 'Systems Programming',
      date: '2024-01-20',
      summary: 'Fork-exec process cycles, file descriptor piping, signal handling, and memory safety fundamentals in POSIX C.',
      url: 'https://github.com/sirbor843/simple_shell'
    }
  ],

  /* Reference architectures — each stage is a column, each node is clickable. */
  architectures: [
    {
      id: 'payments',
      label: 'Payment layer',
      caption: 'Idempotent, cache-first payment validation across card and mobile-money rails.',
      stages: [
        { name: 'Ingress', nodes: [
          { id: 'pos', label: 'POS / Checkout', detail: 'Merchant terminals, web checkouts and mobile apps submit payment intents with an idempotency key.' }
        ] },
        { name: 'Service', nodes: [
          { id: 'go', label: 'Go payment API', detail: 'Stateless Go service: validates, routes and profiles every request. Horizontal scaling behind a load balancer.' },
          { id: 'redis', label: 'Redis', detail: 'Cache for merchant config, idempotency keys and hot lookups — the main lever behind the 50%+ latency cut.' }
        ] },
        { name: 'Rails', nodes: [
          { id: 'stripe', label: 'Stripe', detail: 'Card payments. Webhooks verified by signature and de-duplicated before they touch state.' },
          { id: 'mpesa', label: 'M-Pesa', detail: 'Mobile money via Daraja (STK push + callbacks), normalized to the same internal event shape as Stripe.' }
        ] },
        { name: 'Ledger', nodes: [
          { id: 'pg', label: 'PostgreSQL audit trail', detail: 'Append-only audit records and validation checks — halved reconciliation discrepancies.' }
        ] },
        { name: 'Signals', nodes: [
          { id: 'kafka', label: 'Kafka → anomaly alerts', detail: 'Behavioral events stream to Python consumers that flag billing anomalies and churn risk early.' }
        ] }
      ]
    },
    {
      id: 'events',
      label: 'Event pipeline',
      caption: 'Millions of daily events → validated, model-ready feature sets.',
      stages: [
        { name: 'Sources', nodes: [
          { id: 'apps', label: 'Game & app telemetry', detail: 'High-velocity client and server events — sessions, bets, purchases, errors.' }
        ] },
        { name: 'Transport', nodes: [
          { id: 'kafka2', label: 'Kafka / S3 landing', detail: 'Durable, replayable ingestion. Raw events land partitioned by date in the S3 data lake.' }
        ] },
        { name: 'Transform', nodes: [
          { id: 'glue', label: 'AWS Glue + PySpark', detail: 'Distributed jobs clean, de-duplicate and aggregate events into structured feature sets.' }
        ] },
        { name: 'Serve', nodes: [
          { id: 'wh', label: 'Snowflake / Redshift', detail: 'Analysis-ready tables for dashboards, model evaluation and ad-hoc SQL.' }
        ] },
        { name: 'Control', nodes: [
          { id: 'airflow', label: 'Airflow + alerts', detail: 'Orchestration with schema checks and sensors — silent regressions caught in minutes, not hours.' }
        ] }
      ]
    },
    {
      id: 'ml',
      label: 'ML serving',
      caption: 'From feature sets to fresh predictions in operational tools.',
      stages: [
        { name: 'Features', nodes: [
          { id: 'feat', label: 'Feature sets', detail: 'Versioned features produced by the event pipeline — the same definitions for training and serving.' }
        ] },
        { name: 'Train', nodes: [
          { id: 'train', label: 'scikit-learn / PyTorch', detail: 'Churn, LTV and spatial valuation models, evaluated against held-out time windows.' }
        ] },
        { name: 'Package', nodes: [
          { id: 'docker', label: 'Docker image', detail: 'Model + inference code shipped as one immutable container.' }
        ] },
        { name: 'Serve', nodes: [
          { id: 'fastapi', label: 'FastAPI inference', detail: 'Low-latency HTTP inference, batch and real-time endpoints.' },
          { id: 'llm', label: 'LLM / RAG layer', detail: 'Retrieval-augmented generation and agentic automation embedded into business tools.' }
        ] },
        { name: 'Consume', nodes: [
          { id: 'ops', label: 'Ops dashboards', detail: 'Predictions delivered where teams already work — dashboards, alerts and internal tools.' }
        ] }
      ]
    }
  ]
};

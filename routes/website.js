const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

// Blog posts data
const posts = [
    {
        title: "Reducing Uncertainty in Decision-Making: 4 Concrete Steps",
        slug: "reducing-uncertainty-in-decision-making",
        date: "2021-03-09",
        author: "Dmitry Kalinchenko",
        excerpt: "Making decisions with a high level of uncertainty is often a daunting task, especially when the stakes are high. Fortunately, there are some concrete tools a decision-maker can leverage to reduce uncertainty and gain confidence.",
        content: `
            <h2>Step 1: Thoroughly explore the solution space</h2>
            <p>Not everything is equally important (at least not always), so understanding the relative hierarchy of priorities is crucial. Prioritizing your desired outcomes can be done in a variety of ways, some of the most common are:</p>
            
            <h3>Pairwise comparison</h3>
            <p>In pairwise you tradeoff alternatives one against another. The more alternatives you have, the more pairs you have to rank, so this method is only advisable when you have 10 or fewer outcomes you are considering.</p>
            
            <h3>Rank order</h3>
            <p>This is a pretty straight-forward method where you rank each outcome relative to others. The outcome is the same as in pairwise, but the process generally takes less time.</p>
            
            <h3>Weighted allocation</h3>
            <p>This is the method we use within Rationalize. The idea is that a fixed amount of points gets distributed between the outcomes. In our case, we use 100% points distributed across the outcomes or criteria.</p>
            
            <h2>Step 2: Clearly define desired outcomes</h2>
            <p>Now that you have your alternatives and outcomes identified, you can get to understanding how well each alternative satisfies the criteria or outcomes you have identified. Using a basic decision matrix approach works really well here – you already have all the ingredients to do the ranking.</p>
            
            <h2>Step 3: Systematically score your alternatives</h2>
            <p>You can use a spreadsheet to run through this type of evaluation, but we recommend using tools like Rationalize.io because it allows you to leverage the wisdom of the crowds to further reduce the uncertainty – which is the next step.</p>
            
            <h2>Step 4: Solicit other perspectives</h2>
            <p>Up to this point, we took a rational approach to understand the problem and break down the solution space. You might have a decent perspective already. However, your perspective is inherently limited by your own experiences and biases. Involving other individuals in this decision-making process is a great antidote against this built-in bias that your individualized perspective brings.</p>
            
            <h3>Make it easy for people to contribute</h3>
            <p>If you are not paying people to provide their perspective, then making it super easy for them to contribute is crucial. Using tools like Rationalize.io is the best way to make it as seamless as possible for these people to contribute their opinion.</p>
            
            <h3>Find points of disagreement</h3>
            <p>Understanding where people disagree can help identify where real uncertainty lies. The best way to find the points of disagreement is to calculate the standard deviation between the responses.</p>
            
            <h3>Talk to the outliers</h3>
            <p>Once you have a feel for how people and groups think, you can start seeing where they agree and disagree. These points of disagreement is where you should dig deeper and explore why people disagree.</p>
            
            <h3>Figure out how groups of people think</h3>
            <p>If you were able to get a sizable group of people to contribute to your decision, you might want to consider segmenting this population to understand how similar people think.</p>
            
            <h2>Summing it up</h2>
            <p>Making decisions with a high level of uncertainty is often a daunting task, especially when the stakes are high. Fortunately, there are some concrete tools a decision-maker can leverage in order to reduce the uncertainty and gain confidence to stand behind the decision.</p>
        `
    },
    {
        title: "Frameworks for Idea Evaluation",
        slug: "frameworks-for-idea-evaluation",
        date: "2021-03-09",
        author: "Dmitry Kalinchenko",
        excerpt: "There has been a lot written about how to 'best' evaluate ideas in an innovation process. Practically every company working within or adjacent to the space of innovation has created some kind of framework they use to evaluate ideas.",
        content: `
            <p>There has been a lot written about how to "best" evaluate ideas in an innovation process. Practically every company working within or adjacent to the space of innovation has created some kind of framework they use to evaluate ideas. While it is not up to us to determine which particular framework works best, we can outline some of these approaches.</p>

            <h2>Simple Frameworks</h2>
            <p>These approaches to idea evaluation are slightly more complicated than a general thumbs up/thumbs down method. Still, they provide a basic amount of rigor when it comes to evaluation. Use these frameworks at early stage of idea development when you do not have a clearly defined concept.</p>

            <h3>Impact, Confidence, Ease (ICE) - Growth Hackers</h3>
            <p>This framework can be called a Minimum Viable Idea Prioritization Framework. The idea is to quickly sort the concepts on 3 basic criteria and get the score without going too much into the weeds of the framework.</p>
            <ul>
                <li><strong>Impact:</strong> How impactful do I expect this test to be?</li>
                <li><strong>Confidence:</strong> How sure am I that this test will prove my hypothesis?</li>
                <li><strong>Ease:</strong> How easily can I get launch this test?</li>
            </ul>

            <h3>Time, Impact, Resources (TIR)</h3>
            <p>Another simple framework for prioritization. Organizations can sort out their priorities based on:</p>
            <ul>
                <li><strong>Time:</strong> How long will it take to execute a project until its completion?</li>
                <li><strong>Impact:</strong> The amount of revenue potential (or reduced costs) from the execution of your project.</li>
                <li><strong>Resources:</strong> The associated costs needed to execute a project.</li>
            </ul>

            <h2>Complex Evaluation Frameworks</h2>
            <p>These are a bit more involved than the frameworks outlined above. As you devote more time and attention to your ideas, the more dimensions you are able to assess.</p>

            <h3>Should-Could Framework</h3>
            <p>The Should/Could tool is used to compare a set of opportunities on their inherent potential and the company's capabilities to deliver on that potential.</p>
            <ul>
                <li><strong>The Should Dimension:</strong> Is about "Should anyone" pursue the opportunity (not "Should we").</li>
                <li><strong>The Could Dimension:</strong> Is about "Could we" pursue the opportunity successfully.</li>
            </ul>

            <h3>Innovation Project Scorecard</h3>
            <p>Strategyzer's Innovation Project Scorecard attempts to assess ideas on 6 basic categories of criteria:</p>
            <ul>
                <li>Strategic Fit</li>
                <li>Opportunity</li>
                <li>Desirability</li>
                <li>Feasibility</li>
                <li>Viability</li>
                <li>Adaptability</li>
            </ul>
        `
    },
    {
        title: "How to Use Grid Analysis for Idea Evaluation",
        slug: "grid-analysis-for-idea-evaluation",
        date: "2021-03-09",
        author: "Dmitry Kalinchenko",
        excerpt: "Grid analysis (also known as Decision Matrix, Pugh Decision Matrix, Weighted Scorecard, and others) is a framework for evaluating ideas and making decisions that uses a set of weighted criteria to rank the ideas.",
        content: `
            <h2>What are the Benefits of Using Grid Analysis to Evaluate Ideas?</h2>
            <p>The main benefit of using Grid Analysis for decision making and idea evaluation is to make the process more objective. By using a concrete set of criteria with distinct weights, the decision-maker can inject a certain amount of rationality in the process and, subsequently, more easily justify their decision to others if needed.</p>

            <h2>Where is Grid Analysis Used?</h2>
            <p>Grid Analysis can, in theory, be used for any decision which requires selection between a number of concrete alternatives. Practically, it is widely used in areas of:</p>
            <ul>
                <li><strong>Design Engineering:</strong> Which product design best balances user needs with costs?</li>
                <li><strong>Capital Allocation:</strong> Which projects should receive funding?</li>
                <li><strong>Procurement:</strong> Which suppliers best satisfy our demands?</li>
                <li><strong>Product Management:</strong> Which features should be prioritized?</li>
                <li><strong>Strategy:</strong> Which strategy should we pursue?</li>
            </ul>

            <h2>How to Use Grid Analysis? Step-by-step Guide</h2>
            <ol>
                <li><strong>Define the alternatives</strong> you are going to be evaluating.</li>
                <li><strong>Define the criteria.</strong> What is important when choosing between the alternatives?</li>
                <li><strong>Assign weights to the criteria.</strong> How important is each criterion?</li>
                <li><strong>Rank each idea on each criterion.</strong> Score each concept on each criterion.</li>
                <li><strong>Multiply the idea scores by criteria weights.</strong></li>
                <li><strong>Sum up the idea scores.</strong> The highest score is your winner.</li>
            </ol>

            <h2>Example: Using Grid Analysis to Identify the Best Product Design</h2>
            <p>Let's say you're an industrial engineer asked to design an environmentally-friendly container for a new soda drink. You have several designs:</p>
            <ol>
                <li>Plastic Bottle</li>
                <li>Glass Bottle</li>
                <li>Aluminum bottle</li>
            </ol>

            <h3>Criteria to Consider:</h3>
            <ol>
                <li>Environmental-friendliness (Weight: 10)</li>
                <li>Customer Appeal (Weight: 7)</li>
                <li>Cost-effectiveness (Weight: 4)</li>
            </ol>

            <p>After scoring and calculating, the Aluminum Bottle might narrowly beat out the Glass Bottle. However, if you increased the weight of Customer Appeal, the Glass Bottle could become the winner.</p>
        `
    },
    {
        title: "Good Ideas Often Go Nowhere - Here's What You Can Do About It",
        slug: "good-ideas-often-go-nowhere",
        date: "2021-03-15",
        author: "Dmitry Kalinchenko",
        excerpt: "Learn how to effectively evaluate and implement ideas using proven frameworks and methodologies. Don't let good ideas get lost in the shuffle.",
        content: `
            <h2>The Challenge of Idea Implementation</h2>
            <p>Many organizations struggle with effectively evaluating and implementing new ideas. Even when promising concepts are identified, they often fail to gain traction or get lost in the day-to-day operations. This article explores practical approaches to ensure good ideas get the attention and resources they deserve.</p>

            <h2>Key Factors in Successful Idea Implementation</h2>
            <ol>
                <li><strong>Clear Evaluation Criteria</strong>
                    <ul>
                        <li>Strategic alignment</li>
                        <li>Resource requirements</li>
                        <li>Expected impact</li>
                        <li>Implementation complexity</li>
                    </ul>
                </li>
                <li><strong>Structured Decision Process</strong>
                    <ul>
                        <li>Regular review cycles</li>
                        <li>Stakeholder involvement</li>
                        <li>Documentation and tracking</li>
                    </ul>
                </li>
                <li><strong>Resource Allocation</strong>
                    <ul>
                        <li>Dedicated teams</li>
                        <li>Budget allocation</li>
                        <li>Timeline management</li>
                    </ul>
                </li>
            </ol>

            <h2>Best Practices for Idea Management</h2>
            <ul>
                <li>Create a centralized idea repository</li>
                <li>Establish clear evaluation criteria</li>
                <li>Set up regular review cycles</li>
                <li>Involve key stakeholders early</li>
                <li>Track implementation progress</li>
                <li>Celebrate successes and learn from failures</li>
            </ul>

            <h2>Tools and Frameworks</h2>
            <p>Several tools and frameworks can help structure the idea evaluation and implementation process:</p>
            <ul>
                <li>Decision matrices</li>
                <li>Impact/effort grids</li>
                <li>Prioritization frameworks</li>
                <li>Project management tools</li>
            </ul>

            <h2>Conclusion</h2>
            <p>Successfully implementing good ideas requires a systematic approach and organizational commitment. By following these guidelines and using appropriate tools, organizations can better ensure that valuable ideas don't get lost and instead contribute to their success.</p>
        `
    }
];

// Home page
router.get('/', (req, res) => {
    res.render('website/index', {
        title: 'Home',
        layout: 'website/layout'
    });
});

// FAQ page
router.get('/faq', (req, res) => {
    res.render('website/faq', {
        title: 'FAQ',
        layout: 'website/layout'
    });
});

// Contact page
router.get('/contact', (req, res) => {
    res.render('website/contact', {
        title: 'Contact',
        layout: 'website/layout'
    });
});

// Blog page
router.get('/blog', (req, res) => {
    res.render('website/blog', {
        title: 'Blog',
        layout: 'website/layout',
        posts: posts
    });
});

// Individual blog post page
router.get('/blog/:slug', (req, res) => {
    const post = posts.find(p => p.slug === req.params.slug);
    
    if (!post) {
        return res.redirect('/blog');
    }

    res.render('website/blog-post', {
        title: post.title,
        layout: 'website/layout',
        post
    });
});

module.exports = router; 
const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

// Blog posts data
const blogPosts = [
    {
        slug: 'frameworks-for-idea-evaluation',
        title: 'Frameworks for Idea Evaluation',
        date: '2021-03-09',
        author: 'Dmitry Kalinchenko',
        excerpt: 'Explore different frameworks for evaluating ideas in the innovation process, from simple to complex approaches.',
        content: `
            <div class="prose max-w-none">
                <p>When it comes to evaluating ideas in an innovation process, there are many frameworks available. Some are simple and easy to use, while others are more complex and require more time and effort to implement. In this article, we will explore some of the most popular frameworks for idea evaluation.</p>

                <h2>Simple Frameworks</h2>
                
                <p>Simple frameworks are great for quick evaluations and when you need to make decisions fast. They typically involve a few key criteria and can be completed relatively quickly.</p>

                <h3>ICE Framework</h3>
                <p>The ICE framework evaluates ideas based on three criteria:</p>
                <ul>
                    <li><strong>Impact:</strong> How much positive impact will this idea have if successful?</li>
                    <li><strong>Confidence:</strong> How confident are you that this idea will be successful?</li>
                    <li><strong>Ease:</strong> How easy is it to implement this idea?</li>
                </ul>

                <h3>PIE Framework</h3>
                <p>Similar to ICE, the PIE framework uses:</p>
                <ul>
                    <li><strong>Potential:</strong> How much potential impact could this idea have?</li>
                    <li><strong>Importance:</strong> How important is this idea to your goals?</li>
                    <li><strong>Ease:</strong> How easy is it to implement?</li>
                </ul>

                <h2>Complex Frameworks</h2>

                <h3>Timmons Model of Entrepreneurial Process</h3>
                <p>This framework evaluates ideas based on:</p>
                <ul>
                    <li>Opportunity</li>
                    <li>Resources</li>
                    <li>Team</li>
                    <li>Market Context</li>
                    <li>Business Model</li>
                </ul>

                <h3>Stage-Gate Process</h3>
                <p>A comprehensive framework that evaluates ideas through multiple stages:</p>
                <ul>
                    <li>Discovery</li>
                    <li>Scoping</li>
                    <li>Business Case</li>
                    <li>Development</li>
                    <li>Testing</li>
                    <li>Launch</li>
                </ul>

                <p>The key to successful idea evaluation is choosing the right framework for your specific needs and consistently applying it across all ideas being considered.</p>
            </div>
        `
    },
    {
        slug: 'using-grid-analysis-for-idea-evaluation',
        title: 'How to Use Grid Analysis for Idea Evaluation',
        date: '2021-03-09',
        author: 'Dmitry Kalinchenko',
        excerpt: 'Learn how to effectively use Grid Analysis to evaluate and compare different ideas or options systematically.',
        content: `
            <div class="prose max-w-none">
                <p>Grid Analysis, also known as Decision Matrix Analysis or Pugh Matrix Analysis, is a valuable tool for making complex decisions. It's particularly useful when you have multiple good alternatives and many different factors to take into account.</p>

                <h2>Benefits of Grid Analysis</h2>
                <ul>
                    <li>Provides a systematic approach to decision making</li>
                    <li>Helps remove emotional bias from decisions</li>
                    <li>Makes complex decisions more manageable</li>
                    <li>Creates a documented rationale for decisions</li>
                    <li>Allows for group input and consensus building</li>
                </ul>

                <h2>When to Use Grid Analysis</h2>
                <p>Grid Analysis is particularly useful in situations such as:</p>
                <ul>
                    <li>Choosing between different business investment opportunities</li>
                    <li>Deciding between different product features to implement</li>
                    <li>Selecting vendors or suppliers</li>
                    <li>Making hiring decisions</li>
                    <li>Prioritizing projects or initiatives</li>
                </ul>

                <h2>How to Perform Grid Analysis</h2>
                
                <h3>Step 1: Define Your Alternatives</h3>
                <p>List all the viable options you want to compare. These could be different products, strategies, or solutions to your problem.</p>

                <h3>Step 2: Identify Evaluation Criteria</h3>
                <p>Determine what factors are important in making your decision. These might include:</p>
                <ul>
                    <li>Cost</li>
                    <li>Time to implement</li>
                    <li>Technical feasibility</li>
                    <li>Resource requirements</li>
                    <li>Expected benefits</li>
                </ul>

                <h3>Step 3: Assign Weights</h3>
                <p>Not all criteria are equally important. Assign relative weights to each criterion based on its importance to your decision.</p>

                <h3>Step 4: Score Each Option</h3>
                <p>Rate how well each option satisfies each criterion, typically using a scale of 1-5 or 1-10.</p>

                <h3>Step 5: Calculate Weighted Scores</h3>
                <p>Multiply each score by the criterion's weight and sum the results for each option.</p>

                <p>By following these steps systematically, you can make more informed and objective decisions about which ideas or options to pursue.</p>
            </div>
        `
    },
    {
        slug: 'reducing-uncertainty-in-decision-making',
        title: 'Reducing Uncertainty in Decision Making: 4 Concrete Steps',
        date: '2021-03-09',
        author: 'Dmitry Kalinchenko',
        excerpt: 'Learn practical approaches to reduce uncertainty when making important decisions in fast-changing environments.',
        content: `
            <div class="prose max-w-none">
                <p>In these unpredictable and fast-changing times individuals and organizations have to make decisions within an unprecedented level of uncertainty. The success in situations like that hangs on a multitude of factors, all of which increase the level of uncertainty for the decision-maker.</p>

                <p>Fortunately, there are concrete approaches and tools a decision-maker can use to reduce the uncertainty and gain a clear perspective. Using a structured approach to identify potential solutions and multiple relevant desired outcomes can help ensure the best potential decision is being considered.</p>

                <h2>Step 1: Thoroughly explore the space of solutions and alternatives</h2>
                
                <h3>Consider non-starter options</h3>
                <p>Considering non-starters can be useful when uncertainty is high. As you explore and break down the problem further, you may find some parts of these non-starters to be quite useful and may decide to incorporate them into your eventual final choice.</p>

                <h3>Consider hybrid options</h3>
                <p>People often think about solutions as either one or another but fail to consider permutations that incorporate parts of 2 or more options.</p>

                <h3>Consider doing nothing</h3>
                <p>Some decisions may appear uncertain when none of the options are appealing. People, however, tend to get stuck in the mindset that they have to do "something". Considering pros and cons of not doing anything, in this case, can be quite informative.</p>

                <h2>Step 2: Clearly define multiple desired outcomes</h2>
                <p>Rarely does a decision have just a single success criteria, but that is how a lot of people think about decisions. Try some of these things to identify multiple outcomes:</p>

                <h3>Go one level deeper</h3>
                <p>For every desired outcome you identify, ask "what does it really mean?" and try to go a level deeper. For example, if you are buying a house one of the outcomes might be "Living in a good neighborhood". This outcome might seem ambiguous and thus introduce some uncertainty in your decision. Asking what that really means, could yield more quantifiable outcomes:</p>
                <ul>
                    <li>Low crime</li>
                    <li>Good schools</li>
                    <li>Proximity to parks</li>
                </ul>

                <h2>Step 3: Systematically score your alternatives</h2>
                <p>Now that you have your alternatives and outcomes identified, you can get to understanding how well each alternative satisfies the criteria or outcomes you have identified. Using a basic decision matrix approach works really well here.</p>

                <h2>Step 4: Solicit other perspectives</h2>
                <p>Up to this point, we took a rational approach to understand the problem and break down the solution space. However, your perspective is inherently limited by your own experiences and biases. Involving other individuals in this decision-making process is a great antidote against this built-in bias.</p>

                <h3>Make it easy for people to contribute</h3>
                <p>If you are not paying people to provide their perspective, then making it super easy for them to contribute is crucial.</p>

                <h3>Find points of disagreement</h3>
                <p>Understanding where people disagree can help identify where real uncertainty lies.</p>

                <h3>Talk to the outliers</h3>
                <p>Once you have a feel for how people and groups think, you can start seeing where they agree and disagree. These points of disagreement is where you should dig deeper.</p>

                <p>Making decisions with a high level of uncertainty is often a daunting task, especially when the stakes are high. By following these four steps, you can reduce uncertainty and make more confident decisions.</p>
            </div>
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
        posts: blogPosts
    });
});

// Individual blog post page
router.get('/blog/:slug', (req, res) => {
    const post = blogPosts.find(p => p.slug === req.params.slug);
    
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
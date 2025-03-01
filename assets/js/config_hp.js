// Configuration options
const init_phones = ["KEMAR DF (KB50xx) Target", "Ouroboros"], // Optional. Which graphs to display on initial load. Note: Share URLs will override this set
      DIR = "data_hp/",                             // Directory where graph files are stored
      default_channels = ["L","R"],                 // Which channels to display. Avoid javascript errors if loading just one channel per phone
      default_normalization = "Hz",                 // Sets default graph normalization mode. Accepts "dB" or "Hz"
      default_norm_db = 35,                         // Sets default dB normalization point
      default_norm_hz = 630,                        // Sets default Hz normalization point (500Hz is recommended by IEC)
      max_channel_imbalance = 5,                    // Channel imbalance threshold to show ! in the channel selector
      alt_layout = true,                            // Toggle between classic and alt layouts
      alt_sticky_graph = true,                      // If active graphs overflows the viewport, does the graph scroll with the page or stick to the viewport?
      alt_animated = true,                          // Determines if new graphs are drawn with a 1-second animation, or appear instantly
      alt_header = true,                            // Display a configurable header at the top of the alt layout
      alt_tutorial = true                          // Display a configurable frequency response guide below the graph
      site_url = '/',                               // URL of your graph "homepage"
      share_url = true,                             // If true, enables shareable URLs
      watermark_text = "Capra Audio",               // Optional. Watermark appears behind graphs
      watermark_image_url = "assets/images/Capra-Audio-Logo.png",// Optional. If image file is in same directory as config, can be just the filename
      page_title = "Capra Audio",                   // Optional. Appended to the page title if share URLs are enabled
      page_description = "Capra Audio Squigtool",
      accessories = false,                          // If true, displays specified HTML at the bottom of the page. Configure further below
      externalLinksBar = false,                     // If true, displays row of pill-shaped links at the bottom of the page. Configure further below
      expandable = false,                           // Enables button to expand iframe over the top of the parent page
      expandableOnly = false,                       // Prevents iframe interactions unless the user has expanded it. Accepts "true" or "false" OR a pixel value; if pixel value, that is used as the maximum width at which expandableOnly is used
      headerHeight = '0px',                         // Optional. If expandable=true, determines how much space to leave for the parent page header
      darkModeButton = true,                        // Adds a "Dark Mode" button the main toolbar to let users set preference
      targetDashed = true,                          // If true, makes target curves dashed lines
      targetColorCustom = false,                    // If false, targets appear as a random gray value. Can replace with a fixed color value to make all targets the specified color, e.g. "black"
      labelsPosition = "bottom-left",               // Up to four labels will be grouped in a specified corner. Accepts "top-left," bottom-left," "bottom-right," and "default"
      stickyLabels = true,                          // "Sticky" labels 
      analyticsEnabled = false,                     // Enables Google Analytics 4 measurement of site usage
      extraEnabled = true,                          // Enable extra features
      extraUploadEnabled = true,                    // Enable upload function
      extraEQEnabled = true,                        // Enable parametic eq function
      extraEQBands = 10,                             // Default EQ bands available
      extraEQBandsMax = 20,                         // Max EQ bands available
      num_samples = 5,                              // Number of samples to average for smoothing
      scale_smoothing = 0.2;                        // Smoothing factor for scale transitions
      

// Specify which targets to display
const targets = [
    { type:"HRTF",    files:["KEMAR DF (KB50xx)","KEMAR DF (KB50xx, Smooth)"] },
];

// Haruto's Addons
const  preference_bounds_name = "Preference Bounds RAW", // Preference bounds name
       preference_bounds_dir = "assets/pref_bounds/",    // Preference bounds directory
       preference_bounds_startup = false,           // If true, preference bounds are displayed on startup
       PHONE_BOOK = "phone_book_hp.json",           // Phone book file path & name
       default_DF_name = "KEMAR DF (KB50xx)",    // Default RAW DF name
       dfBaseline = true,                          // Enable REW import function
       default_bass_shelf = 0,                      // Default Custom DF bass shelf value
       default_tilt = -1.0,                         // Default Custom DF tilt value
       default_ear = 0,                             // Default Custom DF ear gain value
       default_treble = 0,                          // Default Custom DF treble gain value
       tiltableTargets = ["KEMAR DF (KB50xx)","KEMAR DF (KB50xx, Smooth)"],  // Targets that are allowed to be tilted
       compTargets = ["KEMAR DF (KB50xx)"],      // Targets that are allowed to be used for compensation
       allowCreatorSupport = false;                 // Allow the creator to have a button top right to support them



// *************************************************************
// Functions to support config options set above; probably don't need to change these
// *************************************************************

// But I will anyways haha - Haruto

// Set up the watermark, based on config options above
function watermark(svg) {
    let wm = svg.append("g")
        .attr("transform", "translate("+(pad.l+W/2)+","+(pad.t+H/2-20)+")")
        .attr("opacity",0.2);
    
    if ( watermark_image_url ) {
        wm.append("image")
            .attrs({id:'logo', x:-64, y:-64, width:128, height:128, "xlink:href":watermark_image_url, "class":"graph_logo"});
    }
    
    if ( watermark_text ) {
        wm.append("text")
            .attrs({id:'wtext', x:0, y:80, "font-size":28, "text-anchor":"middle", "class":"graph-name"})
            .text(watermark_text);
    }

    // Extra flair
    svg.append("g")
        .attr("opacity",0.2)
        .append("text")
        .attrs({x:765, y:314, "font-size":10, "text-anchor":"end", "class":"site_name"})
        .text("squig.capraaudio.com");
}



// Parse fr text data from REW or AudioTool format with whatever separator
function tsvParse(fr) {
    return fr.split(/[\r\n]/)
        .map(l => l.trim()).filter(l => l && l[0] !== '*')
        .map(l => l.split(/[\s,]+/).map(e => parseFloat(e)).slice(0, 2))
        .filter(t => !isNaN(t[0]) && !isNaN(t[1]));
}



// Apply stylesheet based layout options above
function setLayout() {
    function applyStylesheet(styleSheet) {
        var docHead = document.querySelector("head"),
            linkTag = document.createElement("link");
        
        linkTag.setAttribute("rel", "stylesheet");
        linkTag.setAttribute("type", "text/css");
        
        linkTag.setAttribute("href", styleSheet);
        docHead.append(linkTag);
    }

    if ( !alt_layout ) {
        applyStylesheet("assets/css/style.css");
    } else {
        applyStylesheet("assets/css/style-alt.css");
        applyStylesheet("assets/css/style-alt-theme.css");
    }
}
setLayout();



// Configure HTML accessories to appear at the bottom of the page. Displayed only if accessories (above) is true
// There are a few templates here for ease of use / examples, but these variables accept any HTML
const 
    // Short text, center-aligned, useful for a little side info, credits, links to measurement setup, etc. 
    simpleAbout = `
        <p class="center">This web software is based on the <a href="https://github.com/mlochbaum/CrinGraph">CrinGraph</a> open source software project. <a href="https://www.teachmeaudio.com/mixing/techniques/audio-spectrum">Audio Spectrum</a> definition source.</p>
    `,
    // Which of the above variables to actually insert into the page
    whichAccessoriesToUse = simpleAbout;



// Configure external links to appear at the bottom of the page. Displayed only if externalLinksBar (above) is true
const linkSets = [
    {
        label: "IEM graph databases",
        links: [
            {
                name: "Audio Discourse",
                url: "https://iems.audiodiscourse.com/"
            },
            {
                name: "In-Ear Fidelity",
                url: "https://crinacle.com/graphs/iems/graphtool/"
            },
            {
                name: "Precogvision",
                url: "https://precog.squig.link/"
            },
            {
                name: "Super* Review",
                url: "https://squig.link/"
            },
            {
                name: "Timmy",
                url: "https://timmyv.squig.link/"
            },
        ]
    },
    {
        label: "Headphones",
        links: [
            {
                name: "Audio Discourse",
                url: "https://headphones.audiodiscourse.com/"
            },
            {
                name: "In-Ear Fidelity",
                url: "https://crinacle.com/graphs/headphones/graphtool/"
            },
            {
                name: "Listener",
                url: "https://listener800.github.io/"
            },
            {
                name: "Super* Review",
                url: "https://squig.link/hp.html"
            }
        ]
    }
];



// Set up analytics
function setupGraphAnalytics() {
    if ( analyticsEnabled ) {
        const pageHead = document.querySelector("head"),
              graphAnalytics = document.createElement("script"),
              graphAnalyticsSrc = "graphAnalytics.js";
        
        graphAnalytics.setAttribute("src", graphAnalyticsSrc);
        pageHead.append(graphAnalytics);
    }
}
setupGraphAnalytics();



// If alt_header is enabled, these are the items added to the header
let headerLogoText = "Capra-Audio",
    headerLogoImgUrl = "assets/images/capyay.svg",
    headerLinks = [
    {
        name: "IEMs",
        url: "index.html"
    },
    {
        name: "Headphones",
        url: "headphones.html"
    }
];

// Source: https://www.teachmeaudio.com/mixing/techniques/audio-spectrum
let tutorialDefinitions = [
    {
        name: 'Sub bass',
        width: '16%',
        description: 'The Rumble, usually out of human\'s hearing range and tend to be felt more than heard, providing a sense of power.'
    },
    {
        name: 'Bass',
        width: '20.6%',
        description: 'Determins how "fat" or "thin" the sound is, boosting around 250hz tend to add a feeling of warmth. If you\'re a bass head you most likely like this range.'
    },
    {
        name: 'Lower Mids',
        width: '10.1%',
        description: 'Low order harmonics of most instruments, generally viewed as the bass presence range. Boosting a signal around 300 Hz adds clarity to the bass and lower-stringed instruments. Too much boost around 500 Hz can make higher-frequency instruments sound muffled.'
    },
    {
        name: 'Midrange',
        width: "20%",
        description: 'The midrange determines how prominent an instrument is in the mix. Boosting around 1000 Hz can give instruments a horn-like quality. Excess output at this range can sound tinny and may cause ear fatigue.'
    },
    {
        name: 'Upper Mids',
        width: "10%",
        description: 'The high midrange is responsible for the attack on percussive and rhythm instruments. If boosted, this range can add presence. However, too much boost around the 3 kHz range can cause listening fatigue.'
    },
    {
        name: 'Presence',
        width: '5.9%',
        description: 'The presence range is responsible for the clarity and definition of a sound. Over-boosting can cause an irritating, harsh sound. Cutting in this range makes the sound more distant and transparent.'
    },
    {
        name: 'Brilliance',
        width: '17.4%',
        description: 'The brilliance range is composed entirely of harmonics and is responsible for sparkle and air of a sound. Over boosting in this region can accentuate hiss and cause ear fatigue.'
    }
]

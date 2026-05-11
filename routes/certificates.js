const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const crypto = require('crypto');

const generateCodes = () => {
    const certId = 'CERT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const verCode = crypto.randomBytes(6).toString('hex').toUpperCase();
    return { certId, verCode };
};

// @route   GET /api/certificates/my/:userId
router.get('/my/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId))
            return res.status(400).json({ msg: 'Invalid User ID' });
        const certificates = await Certificate.find({ userId, revoked: false }).sort({ issuedDate: -1 });
        res.json(certificates);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/certificates/preview/:certId
router.get('/preview/:certId', async (req, res) => {
    try {
        const { certId } = req.params;
        const cert = await Certificate.findOne({ certificateId: certId });

        if (!cert) return res.status(404).send('Certificate not found');
        if (cert.revoked) return res.status(403).send('This certificate has been revoked.');

        const dateFormatted = new Date(cert.issuedDate).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate — ${cert.userName}</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400;700;900&family=Cinzel:wght@400;600;700;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            background: #1a1008;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 28px;
        }

        /* ── Outer frame ── */
        .cert-container {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
        }
        .cert-frame {
            width: 1122px;
            height: 793px;
            background: #f5f0e4;
            border: 16px solid #0d0a04;
            position: relative;
            overflow: hidden;
            font-family: 'Noto Serif JP', serif;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Double border inset */
        .cert-frame::before {
            content: '';
            position: absolute;
            inset: 8px;
            border: 1.5px solid #b8942a;
            z-index: 1;
            pointer-events: none;
        }
        .cert-frame::after {
            content: '';
            position: absolute;
            inset: 14px;
            border: 0.5px solid rgba(142,0,28,0.2);
            z-index: 1;
            pointer-events: none;
        }

        /* ── Corner ornaments ── */
        .corner-ornament {
            position: absolute;
            width: 80px;
            height: 80px;
            z-index: 3;
        }
        .co-tl { top: 16px; left: 16px; }
        .co-tr { top: 16px; right: 16px; transform: scaleX(-1); }
        .co-bl { bottom: 16px; left: 16px; transform: scaleY(-1); }
        .co-br { bottom: 16px; right: 16px; transform: scale(-1, -1); }

        /* ── Crimson side panels ── */
        .side-panel {
            position: absolute;
            top: 0; bottom: 0;
            width: 52px;
            background: #8e001c;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .side-panel.left { left: 0; }
        .side-panel.right { right: 0; }

        .vertical-text {
            font-family: 'Noto Serif JP', serif;
            font-size: 10px;
            font-weight: 700;
            color: #f5e6a0;
            writing-mode: vertical-rl;
            text-orientation: mixed;
            letter-spacing: 5px;
            white-space: nowrap;
        }
        .gold-dots {
            display: flex;
            flex-direction: column;
            gap: 5px;
            margin: 8px 0;
        }
        .gdot {
            width: 4px; height: 4px;
            background: #f5e6a0;
            border-radius: 50%;
            opacity: 0.7;
        }

        /* ── Main content area ── */
        .main-content {
            position: absolute;
            top: 48%; /* Slightly above center for optical balance */
            left: 60px; right: 60px;
            transform: translateY(-50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            text-align: center;
            z-index: 4;
            gap: 10px; /* Tight uniform spacing */
        }

        /* ── Typography ── */
        .kanji-hero {
            font-family: 'Noto Serif JP', serif;
            font-weight: 900;
            font-size: 54px;
            color: #8e001c;
            letter-spacing: 14px;
            line-height: 1;
            margin: 0;
        }
        .cert-en-title {
            font-family: 'Cinzel', serif;
            font-size: 22px;
            color: #1a1008;
            letter-spacing: 6px;
            font-weight: 700;
            margin: 0;
        }
        .cert-sub {
            font-family: 'Cinzel', serif;
            font-size: 8px;
            letter-spacing: 2px;
            color: #b8942a;
            font-weight: 600;
            text-transform: uppercase;
            margin: -5px 0 5px;
        }

        /* Gold rule with diamond ends */
        .gold-rule {
            width: 100%;
            height: 1px;
            background: #b8942a;
            margin: 5px 0;
            position: relative;
            flex-shrink: 0;
        }
        .gold-rule::before, .gold-rule::after {
            content: '';
            position: absolute;
            top: -2.5px;
            width: 5px; height: 5px;
            background: #b8942a;
            transform: rotate(45deg);
        }
        .gold-rule::before { left: 0; }
        .gold-rule::after { right: 0; }

        .award-intro {
            font-size: 8.5px;
            font-style: italic;
            color: #5a4a2a;
            letter-spacing: 2px;
            font-family: 'Playfair Display', serif;
            margin: 0;
        }
        .student-name {
            font-family: 'Playfair Display', serif;
            font-style: italic;
            font-size: 46px; /* Increased size */
            font-weight: 900; /* Bolder */
            color: #8e001c;
            margin: 2px 0;
            padding-bottom: 2px;
            border-bottom: 2px solid #b8942a; /* Thicker border */
            display: inline-block;
            letter-spacing: 1px;
            line-height: 1.1;
        }
        .body-text {
            font-size: 8.5px;
            max-width: 72%;
            margin: 5px 0;
            line-height: 1.7;
            color: #2e2010;
            font-weight: 400;
        }
        .hl { font-weight: 900; color: #8e001c; } /* Bolder */

        /* ── Footer signatures ── */
        .footer-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            width: 100%;
            margin-top: 15px; /* Grouped tightly with text */
            padding: 0 10px;
            gap: 15px;
            position: relative;
        }
        .sig-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 33%;
        }
        .sig-name {
            font-family: 'Playfair Display', serif;
            font-style: italic;
            font-weight: 700; /* Bold */
            font-size: 20px;
            color: #1a1008;
            line-height: 1;
            margin-bottom: 4px;
            white-space: nowrap;
        }
        .sig-underline {
            width: 100%;
            height: 1px;
            background: #1a1008;
            margin-bottom: 5px;
        }
        .sig-role {
            font-family: 'Cinzel', serif;
            font-size: 6.5px;
            letter-spacing: 1.2px;
            text-transform: uppercase;
            font-weight: 900; /* Bolder */
            color: #5a4a2a;
        }

        /* Hanko seal - Centered Bottom */
        .hanko {
            width: 75px;
            height: 75px;
            border: 2px solid #8e001c;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #8e001c;
            font-size: 6px;
            font-weight: 900; /* Bolder */
            letter-spacing: 0.5px;
            text-align: center;
            transform: rotate(-7deg);
            position: relative;
            background: rgba(142,0,28,0.03);
            font-family: 'Cinzel', serif;
            line-height: 1.6;
            flex-shrink: 0;
            margin-bottom: -10px;
        }
        .hanko::before {
            content: '';
            position: absolute;
            inset: 3px;
            border: 0.5px solid #8e001c;
        }

        /* ── Metadata bar - Pinned to absolute bottom border ── */
        .meta-bar {
            position: absolute;
            bottom: 18px; /* Closer to edge */
            left: 100px; right: 100px;
            border-top: 0.5px solid rgba(184,148,42,0.3);
            padding-top: 5px;
            display: flex;
            justify-content: space-between;
            font-family: 'Cinzel', serif;
            font-size: 5.5px;
            color: #8a7550;
            letter-spacing: 1.2px;
            z-index: 10;
        }
        .meta-bar .val { color: #8e001c; font-weight: 900; } /* Bolder */

        /* Watermark */
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-family: 'Noto Serif JP', serif;
            font-size: 350px;
            color: rgba(184, 148, 42, 0.05); /* Faint gold */
            font-weight: 900;
            z-index: 0;
            pointer-events: none;
            user-select: none;
        }

        @media print {
            body { background: none; padding: 0; }
            .cert-frame {
                box-shadow: none;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }

        /* Responsive scaling for all screens smaller than the cert */
        @media screen and (max-width: 1180px) {
            body {
                padding: 0;
                min-height: 100vh;
                overflow: hidden;
            }
            .cert-container {
                width: 1122px;
                height: 793px;
                min-height: auto;
            }
        }

        /* Portrait: scale to fit BOTH width AND height — full cert visible */
        @media screen and (max-width: 1180px) and (orientation: portrait) {
            body {
                align-items: flex-start;
                justify-content: flex-start;
                background: #1a1008;
            }
            .cert-container {
                transform: scale(min(calc(100vw / 1122), calc(100vh / 793)));
                transform-origin: top left;
            }
        }

        /* Landscape: scale to viewport width (preserves current perfect layout) */
        @media screen and (max-width: 1180px) and (orientation: landscape) {
            body {
                align-items: flex-start;
                justify-content: flex-start;
            }
            .cert-container {
                transform: scale(calc(100vw / 1122));
                transform-origin: top left;
            }
        }
    </style>
</head>
<body>
<div class="cert-container">
<div class="cert-frame">

    <div class="watermark">達</div>

    <!-- Corner ornaments -->
    <svg class="corner-ornament co-tl" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4 L4 44 M4 4 L44 4" stroke="#b8942a" stroke-width="3" fill="none"/>
        <path d="M12 4 L12 12 L4 12" stroke="#8e001c" stroke-width="0.8" fill="none"/>
        <circle cx="4" cy="4" r="3" fill="#b8942a"/>
        <path d="M20 4 Q20 20 4 20" stroke="#b8942a" stroke-width="0.8" fill="none"/>
        <path d="M36 4 Q36 36 4 36" stroke="rgba(184,148,42,0.4)" stroke-width="0.5" fill="none"/>
    </svg>
    <svg class="corner-ornament co-tr" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4 L4 44 M4 4 L44 4" stroke="#b8942a" stroke-width="3" fill="none"/>
        <path d="M12 4 L12 12 L4 12" stroke="#8e001c" stroke-width="0.8" fill="none"/>
        <circle cx="4" cy="4" r="3" fill="#b8942a"/>
        <path d="M20 4 Q20 20 4 20" stroke="#b8942a" stroke-width="0.8" fill="none"/>
        <path d="M36 4 Q36 36 4 36" stroke="rgba(184,148,42,0.4)" stroke-width="0.5" fill="none"/>
    </svg>
    <svg class="corner-ornament co-bl" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4 L4 44 M4 4 L44 4" stroke="#b8942a" stroke-width="3" fill="none"/>
        <path d="M12 4 L12 12 L4 12" stroke="#8e001c" stroke-width="0.8" fill="none"/>
        <circle cx="4" cy="4" r="3" fill="#b8942a"/>
        <path d="M20 4 Q20 20 4 20" stroke="#b8942a" stroke-width="0.8" fill="none"/>
        <path d="M36 4 Q36 36 4 36" stroke="rgba(184,148,42,0.4)" stroke-width="0.5" fill="none"/>
    </svg>
    <svg class="corner-ornament co-br" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4 L4 44 M4 4 L44 4" stroke="#b8942a" stroke-width="3" fill="none"/>
        <path d="M12 4 L12 12 L4 12" stroke="#8e001c" stroke-width="0.8" fill="none"/>
        <circle cx="4" cy="4" r="3" fill="#b8942a"/>
        <path d="M20 4 Q20 20 4 20" stroke="#b8942a" stroke-width="0.8" fill="none"/>
        <path d="M36 4 Q36 36 4 36" stroke="rgba(184,148,42,0.4)" stroke-width="0.5" fill="none"/>
    </svg>

    <!-- Crimson side panels with vertical Japanese text -->
    <div class="side-panel left">
        <div class="gold-dots"><div class="gdot"></div><div class="gdot"></div><div class="gdot"></div></div>
        <div class="vertical-text">日本語学習認定書</div>
        <div class="gold-dots"><div class="gdot"></div><div class="gdot"></div><div class="gdot"></div></div>
    </div>
    <div class="side-panel right">
        <div class="gold-dots"><div class="gdot"></div><div class="gdot"></div><div class="gdot"></div></div>
        <div class="vertical-text">精進と達成の証明</div>
        <div class="gold-dots"><div class="gdot"></div><div class="gdot"></div><div class="gdot"></div></div>
    </div>

    <!-- Main content -->
    <div class="main-content">

        <!-- Top decorative art: bamboo waves + chrysanthemum -->
        <svg width="100%" height="64" viewBox="0 0 660 64" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style="margin-bottom:6px; flex-shrink:0;">
            <g opacity="0.12">
                <circle cx="330" cy="32" r="28" stroke="#8e001c" stroke-width="0.8" fill="none"/>
                <circle cx="330" cy="32" r="22" stroke="#8e001c" stroke-width="0.5" fill="none"/>
                <line x1="330" y1="4" x2="330" y2="60" stroke="#8e001c" stroke-width="0.4"/>
                <line x1="302" y1="32" x2="358" y2="32" stroke="#8e001c" stroke-width="0.4"/>
                <g transform="translate(330,32)">
                    <g transform="rotate(0)">  <ellipse cx="0" cy="-16" rx="4.5" ry="8" fill="#8e001c"/></g>
                    <g transform="rotate(30)"> <ellipse cx="0" cy="-16" rx="4.5" ry="8" fill="#8e001c"/></g>
                    <g transform="rotate(60)"> <ellipse cx="0" cy="-16" rx="4.5" ry="8" fill="#8e001c"/></g>
                    <g transform="rotate(90)"> <ellipse cx="0" cy="-16" rx="4.5" ry="8" fill="#8e001c"/></g>
                    <g transform="rotate(120)"><ellipse cx="0" cy="-16" rx="4.5" ry="8" fill="#8e001c"/></g>
                    <g transform="rotate(150)"><ellipse cx="0" cy="-16" rx="4.5" ry="8" fill="#8e001c"/></g>
                    <g transform="rotate(180)"><ellipse cx="0" cy="-16" rx="4.5" ry="8" fill="#8e001c"/></g>
                    <g transform="rotate(210)"><ellipse cx="0" cy="-16" rx="4.5" ry="8" fill="#8e001c"/></g>
                    <g transform="rotate(240)"><ellipse cx="0" cy="-16" rx="4.5" ry="8" fill="#8e001c"/></g>
                    <g transform="rotate(270)"><ellipse cx="0" cy="-16" rx="4.5" ry="8" fill="#8e001c"/></g>
                    <g transform="rotate(300)"><ellipse cx="0" cy="-16" rx="4.5" ry="8" fill="#8e001c"/></g>
                    <g transform="rotate(330)"><ellipse cx="0" cy="-16" rx="4.5" ry="8" fill="#8e001c"/></g>
                    <circle cx="0" cy="0" r="5.5" fill="#b8942a"/>
                </g>
            </g>
            <!-- Bamboo wave left -->
            <path d="M30 32 Q90 8 150 28 Q180 36 200 30" stroke="#b8942a" stroke-width="0.8" fill="none" opacity="0.5"/>
            <path d="M50 42 Q110 52 170 40 Q190 36 210 44" stroke="#b8942a" stroke-width="0.5" fill="none" opacity="0.3"/>
            <path d="M200 30 L200 22 M218 28 L218 18 M236 30 L236 22" stroke="#b8942a" stroke-width="0.7" fill="none" opacity="0.45"/>
            <!-- Bamboo wave right -->
            <path d="M630 32 Q570 8 510 28 Q480 36 460 30" stroke="#b8942a" stroke-width="0.8" fill="none" opacity="0.5"/>
            <path d="M610 42 Q550 52 490 40 Q470 36 450 44" stroke="#b8942a" stroke-width="0.5" fill="none" opacity="0.3"/>
            <path d="M460 30 L460 22 M442 28 L442 18 M424 30 L424 22" stroke="#b8942a" stroke-width="0.7" fill="none" opacity="0.45"/>
        </svg>

        <div class="kanji-hero">修了証</div>
        <div class="cert-en-title">Certificate of Mastery</div>
        <div class="cert-sub">Nihongo Learning Platform &nbsp;·&nbsp; 日本語認定</div>

        <div class="gold-rule"></div>

        <p class="award-intro">This honour is bestowed upon</p>
        <div class="student-name">${cert.userName}</div>

        <!-- Chrysanthemum divider -->
        <svg width="200" height="20" viewBox="0 0 200 20" style="margin:4px 0; flex-shrink:0;" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="10" x2="74" y2="10" stroke="#b8942a" stroke-width="0.6" opacity="0.55"/>
            <g transform="translate(100,10)">
                <g transform="rotate(0)">  <ellipse cx="0" cy="-6" rx="1.8" ry="3.5" fill="#b8942a" opacity="0.7"/></g>
                <g transform="rotate(45)"> <ellipse cx="0" cy="-6" rx="1.8" ry="3.5" fill="#b8942a" opacity="0.7"/></g>
                <g transform="rotate(90)"> <ellipse cx="0" cy="-6" rx="1.8" ry="3.5" fill="#b8942a" opacity="0.7"/></g>
                <g transform="rotate(135)"><ellipse cx="0" cy="-6" rx="1.8" ry="3.5" fill="#b8942a" opacity="0.7"/></g>
                <g transform="rotate(180)"><ellipse cx="0" cy="-6" rx="1.8" ry="3.5" fill="#b8942a" opacity="0.7"/></g>
                <g transform="rotate(225)"><ellipse cx="0" cy="-6" rx="1.8" ry="3.5" fill="#b8942a" opacity="0.7"/></g>
                <g transform="rotate(270)"><ellipse cx="0" cy="-6" rx="1.8" ry="3.5" fill="#b8942a" opacity="0.7"/></g>
                <g transform="rotate(315)"><ellipse cx="0" cy="-6" rx="1.8" ry="3.5" fill="#b8942a" opacity="0.7"/></g>
                <circle cx="0" cy="0" r="2" fill="#8e001c"/>
            </g>
            <line x1="126" y1="10" x2="200" y2="10" stroke="#b8942a" stroke-width="0.6" opacity="0.55"/>
        </svg>

        <p class="body-text">
            Who has demonstrated exceptional discipline, unwavering perseverance, and profound mastery in the <span class="hl">${cert.courseName}</span> curriculum. With a completion score of <span class="hl">${cert.score}%</span>, this scholar has embraced the Bushido spirit of relentless self-improvement, proving their dedication to the noble path of Japanese language and culture.
        </p>

        <!-- Diamond separator -->
        <svg width="100%" height="16" viewBox="0 0 560 16" preserveAspectRatio="xMidYMid meet" style="flex-shrink:0; margin:2px 0;" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="8" x2="222" y2="8" stroke="rgba(184,148,42,0.35)" stroke-width="0.6"/>
            <rect x="252" y="3" width="9" height="9" fill="#b8942a" transform="rotate(45 256 8)" opacity="0.6"/>
            <rect x="270" y="3" width="9" height="9" fill="#8e001c" transform="rotate(45 274 8)" opacity="0.5"/>
            <rect x="288" y="3" width="9" height="9" fill="#b8942a" transform="rotate(45 292 8)" opacity="0.6"/>
            <line x1="322" y1="8" x2="560" y2="8" stroke="rgba(184,148,42,0.35)" stroke-width="0.6"/>
        </svg>

        <!-- Signatures -->
        <div class="footer-row">
            <div class="sig-col">
                <div class="sig-name">Jin Sakai</div>
                <div class="sig-underline"></div>
                <div class="sig-role">Master Instructor</div>
            </div>

            <div class="hanko">
                NIHONGO<br>学習<br>PLATFORM
            </div>

            <div class="sig-col">
                <div class="sig-name">Prem Hari S</div>
                <div class="sig-underline"></div>
                <div class="sig-role">Council Director</div>
            </div>
        </div>

    </div><!-- /main-content -->

    <!-- Metadata pinned to bottom -->
    <div class="meta-bar">
        <span>Issued: <span class="val">${dateFormatted}</span></span>
        <span>Certificate ID: <span class="val">${cert.certificateId}</span></span>
        <span>Verification: <span class="val">${cert.verificationCode}</span></span>
    </div>

</div><!-- /cert-frame -->
</div><!-- /cert-container -->
</body>
</html>`;

        res.send(html);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/certificates/verify/:code
router.get('/verify/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const cert = await Certificate.findOne({ verificationCode: code.toUpperCase() });
        if (!cert)
            return res.status(404).json({ valid: false, msg: 'Invalid verification code' });
        res.json({ valid: !cert.revoked, certificate: cert });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/certificates/admin/all
router.get('/admin/all', async (req, res) => {
    try {
        const { search, level, section } = req.query;
        let query = {};
        if (search) {
            query.$or = [
                { userName:      { $regex: search, $options: 'i' } },
                { userEmail:     { $regex: search, $options: 'i' } },
                { certificateId: { $regex: search, $options: 'i' } }
            ];
        }
        if (level)   query.jlptLevel = level;
        if (section) query.section   = section;
        const certificates = await Certificate.find(query).sort({ issuedDate: -1 });
        res.json(certificates);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// @route   PATCH /api/certificates/admin/revoke/:id
router.patch('/admin/revoke/:id', async (req, res) => {
    try {
        const cert = await Certificate.findById(req.params.id);
        if (!cert) return res.status(404).json({ msg: 'Certificate not found' });
        cert.revoked   = true;
        cert.revokedAt = Date.now();
        await cert.save();
        res.json(cert);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

module.exports = router;

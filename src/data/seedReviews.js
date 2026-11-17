/**
 * Static Seed Reviews Data & Resilient Prerender Fetchers
 *
 * Provides guaranteed fallback data for build-time static prerendering
 * and Vite dev server transforms, ensuring that prerendering NEVER fails
 * even if the local backend or remote API is temporarily unreachable.
 */

export const SEED_REVIEWS_LIST = [
  {
    "slug": "microsoft-corp-msn-as-block-microsoft-review",
    "providerName": "Microsoft-corp-msn-as-block - Microsoft",
    "title": "Microsoft review",
    "rating": 4.8,
    "publishedAt": "2026-11-13T18:57:02.533Z",
    "extra": {
      "faqs": [
        {
          "answer": "Based on MonitorMyHost 24/7 synthetic probes, this host maintains consistent availability with rapid outage recovery.",
          "question": "What is the recorded uptime percentage for this host?"
        },
        {
          "answer": "Yes, a standard money-back guarantee is provided to test the platform risk-free.",
          "question": "Does this provider offer a money-back guarantee?"
        }
      ],
      "plans": [
        {
          "name": "Starter Plan",
          "badge": "",
          "price": "$2.99",
          "period": "mo",
          "features": [
            "1 Website",
            "10 GB Storage",
            "Free SSL"
          ]
        },
        {
          "name": "Business Cloud",
          "badge": "Most Popular",
          "price": "$5.99",
          "period": "mo",
          "features": [
            "100 Websites",
            "100 GB NVMe",
            "Free Domain",
            "Daily Backups"
          ]
        }
      ],
      "expert": {
        "bio": "Conducts multi-region synthetic TTFB and continuous uptime telemetry.",
        "name": "MonitorMyHost Research Team",
        "title": "Infrastructure Performance Analyst",
        "avatarUrl": ""
      },
      "bestFor": "",
      "logoUrl": "",
      "freeDomain": true,
      "affiliateUrl": "",
      "startingPrice": "",
      "categoryRatings": {
        "speed": 4.8,
        "uptime": 4.9,
        "pricing": 4.6,
        "support": 4.5,
        "features": 4.7
      },
      "moneyBackGuarantee": "30 Days"
    },
    "headline": {
      "uptime": 99.711,
      "avgResponseTime": 144,
      "performanceScore": 97,
      "totalChecks": 693
    }
  },
  {
    "slug": "as-hostinger-hostinger-review",
    "providerName": "As-hostinger - Hostinger",
    "title": "HostingerReview : Budget cloud hosting",
    "rating": 4.8,
    "publishedAt": "2026-11-08T22:22:28.418Z",
    "extra": {
      "faqs": [
        {
          "answer": "Based on MonitorMyHost 24/7 synthetic probes, this host maintains consistent availability with rapid outage recovery.",
          "question": "What is the recorded uptime percentage for this host?"
        },
        {
          "answer": "Yes, a standard money-back guarantee is provided to test the platform risk-free.",
          "question": "Does this provider offer a money-back guarantee?"
        }
      ],
      "plans": [
        {
          "name": "Starter Plan",
          "badge": "",
          "price": "$2.99",
          "period": "mo",
          "features": [
            "1 Website",
            "10 GB Storage",
            "Free SSL"
          ]
        },
        {
          "name": "Business Cloud",
          "badge": "Most Popular",
          "price": "$5.99",
          "period": "mo",
          "features": [
            "100 Websites",
            "100 GB NVMe",
            "Free Domain",
            "Daily Backups"
          ]
        }
      ],
      "expert": {
        "bio": "Conducts multi-region synthetic TTFB and continuous uptime telemetry.",
        "name": "MonitorMyHost Research Team",
        "title": "Infrastructure Performance Analyst",
        "avatarUrl": ""
      },
      "bestFor": "small business  ,startup",
      "logoUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAACUCAMAAABC4vDmAAAAhFBMVEVnPeb///9kOeZfMOX9/P9gMuWYgO38+f+Xfu1cK+VmO+ZrQufu6/xeLuVjN+ZhNOVSF+RWH+R1Uejy7/2ije+CY+qrmfC2pvK/sfOplfBYJOTMwPbe1/l5Vemahe1uR+d8W+nk3frOxfa7rPPVzPeHa+uNcuzHuvXp5PuxoPFLAOOSeez6hLt4AAAEeElEQVR4nO2aa3ejKhRAOSixkAAaH6k2xld8JPn//++CptNpm/beTmc0a+7Zqx8SYZUtHOGAIQRBEARBEARBEARBEARBEARBkP8Fgokvl/x5DkTfvC6KA2Ezuzw3Lbx966sbJbQIq4O/SG8J6gEcW/a+t+h6A7BZEWchKXCf8oDekgLYPwSz99YkZehL/rrtqxTAsFK3o+7PS0HYiFdWP6QAqvJW0M0hBWH+agR/koLVvIH1s9T2Q6kHlEKpv1VKrMN7kCqk1syiDYqoVbi8lJcerqwMLVcOP4VLS73gui54T1upZF7fjdS15x6LTGXd/q6kTJSdBHNEFC64zNxik2qHr/vVvCmolXI/BtzqIqhaz5xRidXnHKJigYxYa8nfIV9wKKXza4nyEv+gtOSG7UgxQea20oLswvdx5f3E7E/fOpKMb/vPHsH5M0/hVp1ksqzdT6SWmDyfikzzceq+Iynwdmum5WW4Kymzi+rOShZR8oPT6XQH+dQ+plQzx3HY9CfVPWSem+L+02GUQqm/Ssr9UGqxeYqox/C2lFCNt5SUkHnv3pIyJWW/kJQZpyB/8m5ImZKsXGTfN6J0fHRvSJkMULUL7PuuKL+t3xwvXtH+ZT93kvfSOOs+2LY4Iu1mPh5+QX34kkbOeziMIAhyv7y8RxP/fqTyH6r8okVgX346PrdfZOA4/rh26ICxQBLmTyjCfflcjft2zRNZoKX9NNXJhPkQBH52a6X8KvS4z6kTDY1pTkeD61UdM5/aynM3ET9sRoaWn8JE6ihsHKKbMGImA30MXbd60Ho1VqmJfNiE4aaPv78gCuW5JeUnOAYk2JmtpwfugdPtAJsKmiy6pnNd9gg7zhKAKGNPkEiijgDDBk6MTXX2hCfgmvx9uJlVfE1Kh24ugwTqQMWm8bMfgatMQ3v/zKnQwbmH9Jwp/ixl/MwVaW5jKHxfrIWpW5/P54zwFPoz3xvP3yHVlXljpJyd7S7he3DhF3DtGb6pEJh+yUwcXaVCd9BWKqsgzQjlDrE3ULbtVhipp7Nfw+7bWZaRmgaoDsyw7EwwB0dIuGxMgn60L67fSPWmTxsjxUJoNS1Pkb4OXyKN1NBXEMbfzmhsT/VNs7dSPdho900fcCE7s2+o1uKtVO3vYTBSMoSOsQsMmZEa0iSJqZGyKX37/RN/I+UVwTm1UilsMsnXAKWmnPtFCDF9J5XlpmvN8B2h93kHVTbGVBDwcfjIxtzR75Canr46MA8iHLtDBVVA874rIxfy91LcdkgqtY26PJqkqlUUHQpTUJ8jCPPvD59y4XlKYPF4kHjcUn0Y46SxMVXDiY9SzSRFeGWnBCcZ96Sj1Eic2UeYHaH+/vjRJCmEak8PdsosoqY5EEVEcdk9Nhf7SoF1qY1c1SatonHaUULjyAyrYPHpsUljSstopFCmVKsyOvyGxUdK808UH+dh4WTZ+LsaoXmWTVOzdsbJUNltAnXsNTpdoaaKpPbriCB0qrLQr6sQBEEQBEEQBEEQBEEQBEEQBPlz/ANcOV4mCkkQkQAAAABJRU5ErkJggg==",
      "freeDomain": true,
      "affiliateUrl": "https://www.hostinger.com/",
      "startingPrice": "$2",
      "categoryRatings": {
        "speed": 4.8,
        "uptime": 4.9,
        "pricing": 4.6,
        "support": 4.5,
        "features": 4.7
      },
      "moneyBackGuarantee": "30 Days"
    },
    "headline": {
      "uptime": 98.349,
      "avgResponseTime": 1028,
      "performanceScore": 62,
      "totalChecks": 424
    }
  }
];

export const SEED_REVIEWS_MAP = {
  "microsoft-corp-msn-as-block-microsoft-review": {
    "id": 3,
    "providerKey": "microsoft-corp-msn-as-block---microsoft",
    "providerName": "Microsoft-corp-msn-as-block - Microsoft",
    "slug": "microsoft-corp-msn-as-block-microsoft-review",
    "title": "Microsoft review",
    "reviewText": "microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft microsoft",
    "rating": 4.8,
    "pros": [
      "microsoft"
    ],
    "cons": [
      "microsoft"
    ],
    "extra": {
      "faqs": [
        {
          "answer": "Based on MonitorMyHost 24/7 synthetic probes, this host maintains consistent availability with rapid outage recovery.",
          "question": "What is the recorded uptime percentage for this host?"
        },
        {
          "answer": "Yes, a standard money-back guarantee is provided to test the platform risk-free.",
          "question": "Does this provider offer a money-back guarantee?"
        }
      ],
      "plans": [
        {
          "name": "Starter Plan",
          "badge": "",
          "price": "$2.99",
          "period": "mo",
          "features": [
            "1 Website",
            "10 GB Storage",
            "Free SSL"
          ]
        },
        {
          "name": "Business Cloud",
          "badge": "Most Popular",
          "price": "$5.99",
          "period": "mo",
          "features": [
            "100 Websites",
            "100 GB NVMe",
            "Free Domain",
            "Daily Backups"
          ]
        }
      ],
      "expert": {
        "bio": "Conducts multi-region synthetic TTFB and continuous uptime telemetry.",
        "name": "MonitorMyHost Research Team",
        "title": "Infrastructure Performance Analyst",
        "avatarUrl": ""
      },
      "bestFor": "",
      "logoUrl": "",
      "freeDomain": true,
      "affiliateUrl": "",
      "startingPrice": "",
      "categoryRatings": {
        "speed": 4.8,
        "uptime": 4.9,
        "pricing": 4.6,
        "support": 4.5,
        "features": 4.7
      },
      "moneyBackGuarantee": "30 Days"
    },
    "statsUpdatedAt": "2026-11-13T18:57:02.542Z",
    "isPublished": true,
    "publishedAt": "2026-11-13T18:57:02.533Z",
    "createdAt": "2026-11-13T18:57:02.137Z",
    "updatedAt": "2026-11-13T18:57:02.543Z",
    "stats": {
      "provider": {
        "key": "microsoft-corp-msn-as-block---microsoft",
        "name": "Microsoft-corp-msn-as-block - Microsoft"
      },
      "generatedAt": "2026-11-17T10:31:06.984Z",
      "meetsMinimumData": true,
      "monitors": {
        "total": 2,
        "active": 2
      },
      "checks": {
        "total": 865,
        "up": 863,
        "down": 2,
        "firstAt": "2026-11-03T10:32:57.370Z",
        "lastAt": "2026-11-17T09:34:02.927Z",
        "windowDays": 14
      },
      "uptime": {
        "percentage": 99.769,
        "last7Days": 100,
        "previous7Days": 99.625,
        "changePoints": 0.375
      },
      "responseTime": {
        "avg": 137,
        "min": 44,
        "max": 1117,
        "median": 59,
        "p95": 531,
        "last7DaysAvg": 108,
        "changePercent": -29.9
      },
      "incidents": {
        "count": 2,
        "longestUpStreakChecks": 414,
        "longestDownStreakChecks": 1
      },
      "performanceScore": 97,
      "sites": [
        {
          "label": "Site 1",
          "uptime": 99.841,
          "avgResponseTime": 144,
          "checks": 628
        },
        {
          "label": "Site 2",
          "uptime": 99.578,
          "avgResponseTime": 117,
          "checks": 237
        }
      ],
      "daily": [
        {
          "date": "2026-11-03",
          "uptime": 100,
          "avgResponseTime": 398,
          "checks": 54
        },
        {
          "date": "2026-11-04",
          "uptime": 100,
          "avgResponseTime": 137,
          "checks": 91
        },
        {
          "date": "2026-11-05",
          "uptime": 100,
          "avgResponseTime": 146,
          "checks": 91
        },
        {
          "date": "2026-11-06",
          "uptime": 100,
          "avgResponseTime": 115,
          "checks": 92
        },
        {
          "date": "2026-11-07",
          "uptime": 100,
          "avgResponseTime": 90,
          "checks": 89
        },
        {
          "date": "2026-11-08",
          "uptime": 95.833,
          "avgResponseTime": 115,
          "checks": 48
        },
        {
          "date": "2026-11-09",
          "uptime": 100,
          "avgResponseTime": 161,
          "checks": 46
        },
        {
          "date": "2026-11-10",
          "uptime": 100,
          "avgResponseTime": 122,
          "checks": 48
        },
        {
          "date": "2026-11-11",
          "uptime": 100,
          "avgResponseTime": 83,
          "checks": 48
        },
        {
          "date": "2026-11-12",
          "uptime": 100,
          "avgResponseTime": 118,
          "checks": 48
        },
        {
          "date": "2026-11-13",
          "uptime": 100,
          "avgResponseTime": 129,
          "checks": 48
        },
        {
          "date": "2026-11-14",
          "uptime": 100,
          "avgResponseTime": 143,
          "checks": 48
        },
        {
          "date": "2026-11-15",
          "uptime": 100,
          "avgResponseTime": 94,
          "checks": 46
        },
        {
          "date": "2026-11-16",
          "uptime": 100,
          "avgResponseTime": 70,
          "checks": 48
        },
        {
          "date": "2026-11-17",
          "uptime": 100,
          "avgResponseTime": 160,
          "checks": 20
        }
      ]
    },
    "statsSource": "live"
  },
  "as-hostinger-hostinger-review": {
    "id": 1,
    "providerKey": "as-hostinger---hostinger",
    "providerName": "As-hostinger - Hostinger",
    "slug": "as-hostinger-hostinger-review",
    "title": "HostingerReview : Budget cloud hosting",
    "reviewText": "Hostinger offers affordable cloud hosting with good performance and an easy-to-use interface. It's a great budget-friendly option for hosting websites and applications. Overall, good value for money.\nHostinger offers decent performance for its price, with 98.34% uptime across 424 checks. The average response time of 1028ms is acceptable but could be faster. Overall, it's a reasonable budget hosting option for small projects, though there is room for improvement in reliability and speed.",
    "rating": 4.8,
    "pros": [
      "budget-friendly",
      "98.34% uptime",
      "budget hosting option for small projects"
    ],
    "cons": [
      "occasional downtime.",
      "Renewal prices can be significantly higher than introductory prices"
    ],
    "extra": {
      "faqs": [
        {
          "answer": "Based on MonitorMyHost 24/7 synthetic probes, this host maintains consistent availability with rapid outage recovery.",
          "question": "What is the recorded uptime percentage for this host?"
        },
        {
          "answer": "Yes, a standard money-back guarantee is provided to test the platform risk-free.",
          "question": "Does this provider offer a money-back guarantee?"
        }
      ],
      "plans": [
        {
          "name": "Starter Plan",
          "badge": "",
          "price": "$2.99",
          "period": "mo",
          "features": [
            "1 Website",
            "10 GB Storage",
            "Free SSL"
          ]
        },
        {
          "name": "Business Cloud",
          "badge": "Most Popular",
          "price": "$5.99",
          "period": "mo",
          "features": [
            "100 Websites",
            "100 GB NVMe",
            "Free Domain",
            "Daily Backups"
          ]
        }
      ],
      "expert": {
        "bio": "Conducts multi-region synthetic TTFB and continuous uptime telemetry.",
        "name": "MonitorMyHost Research Team",
        "title": "Infrastructure Performance Analyst",
        "avatarUrl": ""
      },
      "bestFor": "small business  ,startup",
      "logoUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAACUCAMAAABC4vDmAAAAhFBMVEVnPeb///9kOeZfMOX9/P9gMuWYgO38+f+Xfu1cK+VmO+ZrQufu6/xeLuVjN+ZhNOVSF+RWH+R1Uejy7/2ije+CY+qrmfC2pvK/sfOplfBYJOTMwPbe1/l5Vemahe1uR+d8W+nk3frOxfa7rPPVzPeHa+uNcuzHuvXp5PuxoPFLAOOSeez6hLt4AAAEeElEQVR4nO2aa3ejKhRAOSixkAAaH6k2xld8JPn//++CptNpm/beTmc0a+7Zqx8SYZUtHOGAIQRBEARBEARBEARBEARBEARBkP8Fgokvl/x5DkTfvC6KA2Ezuzw3Lbx966sbJbQIq4O/SG8J6gEcW/a+t+h6A7BZEWchKXCf8oDekgLYPwSz99YkZehL/rrtqxTAsFK3o+7PS0HYiFdWP6QAqvJW0M0hBWH+agR/koLVvIH1s9T2Q6kHlEKpv1VKrMN7kCqk1syiDYqoVbi8lJcerqwMLVcOP4VLS73gui54T1upZF7fjdS15x6LTGXd/q6kTJSdBHNEFC64zNxik2qHr/vVvCmolXI/BtzqIqhaz5xRidXnHKJigYxYa8nfIV9wKKXza4nyEv+gtOSG7UgxQea20oLswvdx5f3E7E/fOpKMb/vPHsH5M0/hVp1ksqzdT6SWmDyfikzzceq+Iynwdmum5WW4Kymzi+rOShZR8oPT6XQH+dQ+plQzx3HY9CfVPWSem+L+02GUQqm/Ssr9UGqxeYqox/C2lFCNt5SUkHnv3pIyJWW/kJQZpyB/8m5ImZKsXGTfN6J0fHRvSJkMULUL7PuuKL+t3xwvXtH+ZT93kvfSOOs+2LY4Iu1mPh5+QX34kkbOeziMIAhyv7y8RxP/fqTyH6r8okVgX346PrdfZOA4/rh26ICxQBLmTyjCfflcjft2zRNZoKX9NNXJhPkQBH52a6X8KvS4z6kTDY1pTkeD61UdM5/aynM3ET9sRoaWn8JE6ihsHKKbMGImA30MXbd60Ho1VqmJfNiE4aaPv78gCuW5JeUnOAYk2JmtpwfugdPtAJsKmiy6pnNd9gg7zhKAKGNPkEiijgDDBk6MTXX2hCfgmvx9uJlVfE1Kh24ugwTqQMWm8bMfgatMQ3v/zKnQwbmH9Jwp/ixl/MwVaW5jKHxfrIWpW5/P54zwFPoz3xvP3yHVlXljpJyd7S7he3DhF3DtGb6pEJh+yUwcXaVCd9BWKqsgzQjlDrE3ULbtVhipp7Nfw+7bWZaRmgaoDsyw7EwwB0dIuGxMgn60L67fSPWmTxsjxUJoNS1Pkb4OXyKN1NBXEMbfzmhsT/VNs7dSPdho900fcCE7s2+o1uKtVO3vYTBSMoSOsQsMmZEa0iSJqZGyKX37/RN/I+UVwTm1UilsMsnXAKWmnPtFCDF9J5XlpmvN8B2h93kHVTbGVBDwcfjIxtzR75Canr46MA8iHLtDBVVA874rIxfy91LcdkgqtY26PJqkqlUUHQpTUJ8jCPPvD59y4XlKYPF4kHjcUn0Y46SxMVXDiY9SzSRFeGWnBCcZ96Sj1Eic2UeYHaH+/vjRJCmEak8PdsosoqY5EEVEcdk9Nhf7SoF1qY1c1SatonHaUULjyAyrYPHpsUljSstopFCmVKsyOvyGxUdK808UH+dh4WTZ+LsaoXmWTVOzdsbJUNltAnXsNTpdoaaKpPbriCB0qrLQr6sQBEEQBEEQBEEQBEEQBEEQBPlz/ANcOV4mCkkQkQAAAABJRU5ErkJggg==",
      "freeDomain": true,
      "affiliateUrl": "https://www.hostinger.com/",
      "startingPrice": "$2",
      "categoryRatings": {
        "speed": 4.8,
        "uptime": 4.9,
        "pricing": 4.6,
        "support": 4.5,
        "features": 4.7
      },
      "moneyBackGuarantee": "30 Days"
    },
    "statsUpdatedAt": "2026-11-08T22:22:28.425Z",
    "isPublished": true,
    "publishedAt": "2026-11-08T22:22:28.418Z",
    "createdAt": "2026-11-08T22:22:28.185Z",
    "updatedAt": "2026-11-08T22:22:28.430Z",
    "stats": {
      "provider": {
        "key": "as-hostinger---hostinger",
        "name": "As-hostinger - Hostinger"
      },
      "generatedAt": "2026-11-17T10:29:26.474Z",
      "meetsMinimumData": true,
      "monitors": {
        "total": 1,
        "active": 1
      },
      "checks": {
        "total": 626,
        "up": 619,
        "down": 7,
        "firstAt": "2026-11-03T10:35:55.930Z",
        "lastAt": "2026-11-17T09:34:02.927Z",
        "windowDays": 14
      },
      "uptime": {
        "percentage": 98.882,
        "last7Days": 100,
        "previous7Days": 98.478,
        "changePoints": 1.522
      },
      "responseTime": {
        "avg": 1029,
        "min": 546,
        "max": 2268,
        "median": 920,
        "p95": 1822,
        "last7DaysAvg": 1065,
        "changePercent": 4.8
      },
      "incidents": {
        "count": 6,
        "longestUpStreakChecks": 506,
        "longestDownStreakChecks": 2
      },
      "performanceScore": 68,
      "sites": [
        {
          "label": "Site 1",
          "uptime": 98.882,
          "avgResponseTime": 1029,
          "checks": 626
        }
      ],
      "daily": [
        {
          "date": "2026-11-03",
          "uptime": 94.231,
          "avgResponseTime": 880,
          "checks": 52
        },
        {
          "date": "2026-11-04",
          "uptime": 95.604,
          "avgResponseTime": 1083,
          "checks": 91
        },
        {
          "date": "2026-11-05",
          "uptime": 100,
          "avgResponseTime": 1142,
          "checks": 91
        },
        {
          "date": "2026-11-06",
          "uptime": 100,
          "avgResponseTime": 1108,
          "checks": 92
        },
        {
          "date": "2026-11-07",
          "uptime": 100,
          "avgResponseTime": 903,
          "checks": 76
        },
        {
          "date": "2026-11-08",
          "uptime": 100,
          "avgResponseTime": 766,
          "checks": 24
        },
        {
          "date": "2026-11-09",
          "uptime": 100,
          "avgResponseTime": 848,
          "checks": 23
        },
        {
          "date": "2026-11-10",
          "uptime": 100,
          "avgResponseTime": 924,
          "checks": 24
        },
        {
          "date": "2026-11-11",
          "uptime": 100,
          "avgResponseTime": 942,
          "checks": 24
        },
        {
          "date": "2026-11-12",
          "uptime": 100,
          "avgResponseTime": 892,
          "checks": 24
        },
        {
          "date": "2026-11-13",
          "uptime": 100,
          "avgResponseTime": 1092,
          "checks": 24
        },
        {
          "date": "2026-11-14",
          "uptime": 100,
          "avgResponseTime": 1219,
          "checks": 24
        },
        {
          "date": "2026-11-15",
          "uptime": 100,
          "avgResponseTime": 1110,
          "checks": 23
        },
        {
          "date": "2026-11-16",
          "uptime": 100,
          "avgResponseTime": 1101,
          "checks": 24
        },
        {
          "date": "2026-11-17",
          "uptime": 100,
          "avgResponseTime": 1346,
          "checks": 10
        }
      ]
    },
    "statsSource": "live"
  }
};

const API_ENDPOINTS = [
  'http://localhost:5000',
  'https://api.monitormyhost.com',
];

/**
 * Fetch published reviews list with automatic localhost -> production -> seed fallback.
 */
export async function fetchPublishedReviews(timeoutMs = 3000) {
  for (const base of API_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(`${base}/review`, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return {
            success: true,
            data: json.data,
            pagination: json.pagination || {
              page: 1,
              limit: 10,
              total: json.data.length,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
            },
            source: base,
          };
        }
      }
    } catch {
      // Try next endpoint
    }
  }

  return {
    success: true,
    data: SEED_REVIEWS_LIST,
    pagination: {
      page: 1,
      limit: 10,
      total: SEED_REVIEWS_LIST.length,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
    source: 'seed',
  };
}

/**
 * Fetch a single published review by slug with automatic localhost -> production -> seed fallback.
 */
export async function fetchReviewBySlug(slug, timeoutMs = 3000) {
  const cleanSlug = encodeURIComponent(String(slug).trim());
  for (const base of API_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(`${base}/review/${cleanSlug}`, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return {
            success: true,
            data: json.data,
            source: base,
          };
        }
      }
    } catch {
      // Try next endpoint
    }
  }

  const seedData = SEED_REVIEWS_MAP[slug];
  if (seedData) {
    return {
      success: true,
      data: seedData,
      source: 'seed',
    };
  }

  return null;
}

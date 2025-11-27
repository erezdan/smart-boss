// Mock data for BOSS AI Assistant

export const mockMessages = {
  en: [
    {
      id: 1,
      type: "ai",
      subtype: "insight",
      content:
        "Good morning! Customer flow is stable this morning with 12 customers in the last hour.",
      timestamp: "09:15 AM",
      expandable: {
        title: "Morning Flow Analysis",
        details:
          "Customer traffic shows normal patterns. Peak expected around 11:30 AM based on historical data.",
        metrics: { current: 12, average: 14, trend: "stable" },
      },
    },
    {
      id: 2,
      type: "ai",
      subtype: "alert",
      content: "Alert: Danny left his station 3 times in the past hour",
      timestamp: "09:45 AM",
      severity: "medium",
      image:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
      expandable: {
        title: "Worker Position Alert",
        details:
          "Danny (Cashier) has left station multiple times. Last absence: 5 minutes ago.",
        timeline: [
          "09:12 - Left for 3 min",
          "09:28 - Left for 4 min",
          "09:40 - Left for 2 min",
        ],
      },
    },
    {
      id: 3,
      type: "user",
      content: "Show me today's revenue",
      timestamp: "10:02 AM",
    },
    {
      id: 4,
      type: "ai",
      subtype: "report",
      content: "Revenue today: $2,847 (↑ 12% vs yesterday)",
      timestamp: "10:02 AM",
      chart: true,
      expandable: {
        title: "Daily Revenue Report",
        details: "Strong performance today with increased afternoon sales.",
        breakdown: { morning: 892, afternoon: 1247, evening: 708 },
      },
    },
    {
      id: 5,
      type: "ai",
      subtype: "vision",
      content: "Camera 2 detected: Customer waiting at register for 4 minutes",
      timestamp: "10:15 AM",
      image:
        "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=300&fit=crop",
      severity: "high",
      expandable: {
        title: "Queue Alert - Register 2",
        details:
          "Customer has been waiting for 4 minutes. Current queue length: 3 people.",
        recommendation:
          "Consider opening additional register or assigning support staff.",
      },
    },
    {
      id: 6,
      type: "ai",
      subtype: "task",
      content: "Reminder: Inventory check scheduled at 2:00 PM",
      timestamp: "10:30 AM",
      expandable: {
        title: "Scheduled Task",
        details:
          "Weekly inventory count for storage room A. Estimated duration: 45 minutes.",
        assignedTo: "Sarah, Mike",
      },
    },
  ],
  he: [
    {
      id: 1,
      type: "ai",
      subtype: "insight",
      content: "בוקר טוב! תנועת הלקוחות יציבה הבוקר עם 12 לקוחות בשעה האחרונה.",
      timestamp: "09:15",
      expandable: {
        title: "ניתוח תנועה בוקר",
        details:
          "תנועת הלקוחות מציגה דפוסים רגילים. שיא צפוי בסביבות 11:30 על בסיס נתונים היסטוריים.",
        metrics: { current: 12, average: 14, trend: "stable" },
      },
    },
    {
      id: 2,
      type: "ai",
      subtype: "alert",
      content: "התראה: דני עזב את העמדה 3 פעמים בשעה האחרונה",
      timestamp: "09:45",
      severity: "medium",
      image:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
      expandable: {
        title: "התראת מיקום עובד",
        details:
          "דני (קופאי) עזב את העמדה מספר פעמים. היעדרות אחרונה: לפני 5 דקות.",
        timeline: [
          "09:12 - עזב ל-3 דקות",
          "09:28 - עזב ל-4 דקות",
          "09:40 - עזב ל-2 דקות",
        ],
      },
    },
    {
      id: 3,
      type: "user",
      content: "הצג לי את ההכנסות של היום",
      timestamp: "10:02",
    },
    {
      id: 4,
      type: "ai",
      subtype: "report",
      content: "הכנסות היום: ₪10,245 (↑ 12% לעומת אתמול)",
      timestamp: "10:02",
      chart: true,
      expandable: {
        title: "דוח הכנסות יומי",
        details: "ביצועים חזקים היום עם עלייה במכירות אחר הצהריים.",
        breakdown: { morning: 3208, afternoon: 4487, evening: 2550 },
      },
    },
    {
      id: 5,
      type: "ai",
      subtype: "vision",
      content: "מצלמה 2 זיהתה: לקוח ממתין בקופה 4 דקות",
      timestamp: "10:15",
      image:
        "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=300&fit=crop",
      severity: "high",
      expandable: {
        title: "התראת תור - קופה 2",
        details: "לקוח ממתין 4 דקות. אורך תור נוכחי: 3 אנשים.",
        recommendation: "שקול לפתוח קופה נוספת או להקצות צוות תמיכה.",
      },
    },
  ],
};

export const drawerData = {
  en: {
    insights: {
      title: "Daily Insights",
      items: [
        {
          label: "Customer Flow",
          value: "67 customers",
          trend: "up",
          details: "Peak hours: 11:30 AM - 1:30 PM",
        },
        {
          label: "Worker Distribution",
          value: "8 active",
          trend: "stable",
          details: "2 on break, 1 late arrival",
        },
        {
          label: "Busiest Time Today",
          value: "12:15 PM",
          trend: "up",
          details: "23 customers in 30 minutes",
        },
        {
          label: "Average Wait Time",
          value: "2.3 minutes",
          trend: "down",
          details: "Improved by 18% vs yesterday",
        },
      ],
    },
    alerts: {
      title: "Alerts & Anomalies",
      items: [
        {
          type: "queue",
          severity: "high",
          title: "Long Wait at Register 2",
          description: "Customer waiting 4+ minutes",
          time: "10:15 AM",
          image:
            "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=300&h=200&fit=crop",
        },
        {
          type: "worker",
          severity: "medium",
          title: "Danny Left Station",
          description: "Away from cashier position",
          time: "09:40 AM",
          image:
            "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop",
        },
        {
          type: "suspicious",
          severity: "high",
          title: "Unusual Movement in Storage",
          description: "Unidentified person detected",
          time: "08:52 AM",
          image:
            "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=300&h=200&fit=crop",
        },
      ],
    },
    vision: {
      title: "Vision AI Overview",
      items: [
        {
          camera: "Camera 1 - Entrance",
          activity: "12 entries in last hour",
          snapshot:
            "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=200&fit=crop",
          patterns: "Normal flow, peak expected soon",
        },
        {
          camera: "Camera 2 - Register Area",
          activity: "3 active customers",
          snapshot:
            "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=300&h=200&fit=crop",
          patterns: "Queue forming, assign support",
        },
        {
          camera: "Camera 3 - Storage",
          activity: "Quiet - last activity 45m ago",
          snapshot:
            "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=300&h=200&fit=crop",
          patterns: "Normal - scheduled restocking soon",
        },
      ],
    },
    workers: {
      title: "Worker Behavior",
      items: [
        {
          name: "Sarah",
          role: "Manager",
          status: "On duty",
          location: "Register 1",
          shift: "08:00 - 16:00",
          notes: "Excellent performance today",
        },
        {
          name: "Danny",
          role: "Cashier",
          status: "Position alert",
          location: "Register 2",
          shift: "09:00 - 17:00",
          notes: "Left station 3 times",
        },
        {
          name: "Mike",
          role: "Stock",
          status: "On duty",
          location: "Storage",
          shift: "07:00 - 15:00",
          notes: "Restocking in progress",
        },
      ],
    },
    queue: {
      title: "Queue & Service Metrics",
      items: [
        { time: "09:00 AM", wait: "1.2 min", customers: 3 },
        { time: "10:00 AM", wait: "2.8 min", customers: 7 },
        { time: "11:00 AM", wait: "3.5 min", customers: 12 },
        { time: "12:00 PM", wait: "4.2 min", customers: 15 },
      ],
    },
    business: {
      title: "Business Management",
      sections: [
        {
          title: "Inventory Alerts",
          items: [
            "Low stock: Coffee beans (3 bags left)",
            "Reorder needed: Paper cups",
            "Expiring soon: Milk (2 days)",
          ],
        },
        {
          title: "Finance Summary",
          items: [
            "Daily revenue: $2,847 (↑12%)",
            "Weekly total: $18,423",
            "Top selling: Espresso drinks",
          ],
        },
        {
          title: "Tasks & Reminders",
          items: [
            "Inventory check at 2:00 PM",
            "Staff meeting at 4:00 PM",
            "Equipment maintenance due",
          ],
        },
      ],
    },
  },
  he: {
    insights: {
      title: "תובנות יומיות",
      items: [
        {
          label: "תנועת לקוחות",
          value: "67 לקוחות",
          trend: "up",
          details: "שעות שיא: 11:30 - 13:30",
        },
        {
          label: "פיזור עובדים",
          value: "8 פעילים",
          trend: "stable",
          details: "2 בהפסקה, 1 איחור",
        },
        {
          label: "השעה העמוסה היום",
          value: "12:15",
          trend: "up",
          details: "23 לקוחות ב-30 דקות",
        },
        {
          label: "זמן המתנה ממוצע",
          value: "2.3 דקות",
          trend: "down",
          details: "שיפור של 18% לעומת אתמול",
        },
      ],
    },
    alerts: {
      title: "התראות וחריגות",
      items: [
        {
          type: "queue",
          severity: "high",
          title: "המתנה ארוכה בקופה 2",
          description: "לקוח ממתין יותר מ-4 דקות",
          time: "10:15",
          image:
            "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=300&h=200&fit=crop",
        },
        {
          type: "worker",
          severity: "medium",
          title: "דני עזב את העמדה",
          description: "רחוק ממיקום הקופה",
          time: "09:40",
          image:
            "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop",
        },
        {
          type: "suspicious",
          severity: "high",
          title: "תנועה חריגה במחסן",
          description: "אדם לא מזוהה התגלה",
          time: "08:52",
          image:
            "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=300&h=200&fit=crop",
        },
      ],
    },
    vision: {
      title: "סקירת Vision AI",
      items: [
        {
          camera: "מצלמה 1 - כניסה",
          activity: "12 כניסות בשעה האחרונה",
          snapshot:
            "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=200&fit=crop",
          patterns: "זרימה רגילה, שיא צפוי בקרוב",
        },
        {
          camera: "מצלמה 2 - אזור קופות",
          activity: "3 לקוחות פעילים",
          snapshot:
            "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=300&h=200&fit=crop",
          patterns: "תור נוצר, הקצה תמיכה",
        },
        {
          camera: "מצלמה 3 - מחסן",
          activity: "שקט - פעילות אחרונה לפני 45 דקות",
          snapshot:
            "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=300&h=200&fit=crop",
          patterns: "רגיל - חידוש מלאי מתוכנן בקרוב",
        },
      ],
    },
    workers: {
      title: "התנהגות עובדים",
      items: [
        {
          name: "שרה",
          role: "מנהלת",
          status: "בתפקיד",
          location: "קופה 1",
          shift: "08:00 - 16:00",
          notes: "ביצועים מצוינים היום",
        },
        {
          name: "דני",
          role: "קופאי",
          status: "התראת מיקום",
          location: "קופה 2",
          shift: "09:00 - 17:00",
          notes: "עזב עמדה 3 פעמים",
        },
        {
          name: "מייק",
          role: "מלאי",
          status: "בתפקיד",
          location: "מחסן",
          shift: "07:00 - 15:00",
          notes: "חידוש מלאי בתהליך",
        },
      ],
    },
    queue: {
      title: "מדדי תור ושירות",
      items: [
        { time: "09:00", wait: "1.2 דקות", customers: 3 },
        { time: "10:00", wait: "2.8 דקות", customers: 7 },
        { time: "11:00", wait: "3.5 דקות", customers: 12 },
        { time: "12:00", wait: "4.2 דקות", customers: 15 },
      ],
    },
    business: {
      title: "ניהול עסקי",
      sections: [
        {
          title: "התראות מלאי",
          items: [
            "מלאי נמוך: פולי קפה (3 שקים נותרו)",
            "יש להזמין: כוסות נייר",
            "פג תוקף בקרוב: חלב (יומיים)",
          ],
        },
        {
          title: "סיכום פיננסי",
          items: [
            "הכנסות יומיות: ₪10,245 (↑12%)",
            'סה"כ שבועי: ₪66,321',
            "רב מכר: משקאות אספרסו",
          ],
        },
        {
          title: "משימות ותזכורות",
          items: [
            "בדיקת מלאי בשעה 14:00",
            "ישיבת צוות בשעה 16:00",
            "תחזוקת ציוד מועדת",
          ],
        },
      ],
    },
  },
};

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '@/types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // App Brand & Nav
    appName: 'SetuCare',
    tagline: 'Unified Interoperable Referral Platform',
    registerPatient: 'Register Patient',
    newReferral: 'New Referral',
    myReferrals: 'Referral Inbox',
    track: 'Track Journey',
    queue: 'Live Queue',
    resources: 'Resource Availability',
    medicines: 'Medicine Inventory',
    dashboard: 'District Dashboard',
    auditLog: 'Audit Log',
    prescriptions: 'Prescriptions',
    slaBreaches: 'SLA Breaches',
    
    // Page Titles
    pageRegisterPatient: 'Register Patient & Health Consent',
    pageNewReferral: 'Create Healthcare Referral',
    pageReferralInbox: 'Referral Inbox & Tracking',
    pageReferralDetail: 'Unified Patient Referral Journey',
    pagePublicTrack: 'Patient Referral Status Tracker',
    pageLiveQueue: 'Real-Time Facility Queue',
    pageResourceAvailability: 'Facility Resource Management',
    pageMedicineInventory: 'e-Aushadhi Medicine Inventory',
    pageDistrictDashboard: 'District Health Operations Dashboard',
    pageAuditLog: 'System Interoperability Audit Log',
    pageLanding: 'SetuCare - Unified Healthcare Referrals',

    // Role Labels
    roleASHA: 'ASHA / ANM Worker',
    roleDOCTOR: 'Doctor / Medical Officer',
    roleFACILITY_ADMIN: 'Facility Admin (PHC/CHC/DH)',
    roleDISTRICT_MANAGER: 'District Health Officer',
    roleADMIN: 'System Super Admin',

    // Offline / Sync
    online: 'Online',
    offline: 'Offline',
    pendingSync: 'Pending Sync',
    syncNow: 'Sync Queue Now',
  },
  hi: {
    // App Brand & Nav
    appName: 'सेतुकेयर (SetuCare)',
    tagline: 'एकीकृत स्वास्थ्य प्रेषण मंच',
    registerPatient: 'मरीज़ पंजीकरण',
    newReferral: 'नया रेफरल',
    myReferrals: 'रेफरल इनबॉक्स',
    track: 'रेफरल ट्रैक करें',
    queue: 'लाइव कतार (Queue)',
    resources: 'संसाधन उपलब्धता',
    medicines: 'दवा भंडार (e-Aushadhi)',
    dashboard: 'जिला डैशबोर्ड',
    auditLog: 'ऑडिट लॉग',
    prescriptions: 'दवा पर्ची (Prescriptions)',
    slaBreaches: 'एसएलए उल्लंघन',

    // Page Titles
    pageRegisterPatient: 'मरीज़ पंजीकरण और स्वास्थ्य सहमति',
    pageNewReferral: 'नया स्वास्थ्य रेफरल बनाएं',
    pageReferralInbox: 'रेफरल इनबॉक्स और ट्रैकिंग',
    pageReferralDetail: 'एकीकृत मरीज़ रेफरल यात्रा',
    pagePublicTrack: 'मरीज़ रेफरल स्थिति ट्रैकर',
    pageLiveQueue: 'अस्पताल लाइव कतार (Queue)',
    pageResourceAvailability: 'अस्पताल संसाधन प्रबंधन',
    pageMedicineInventory: 'ई-औषधि दवा भंडार',
    pageDistrictDashboard: 'जिला स्वास्थ्य संचालन डैशबोर्ड',
    pageAuditLog: 'सिस्टम ऑडिट लॉग',
    pageLanding: 'सेतुकेयर - एकीकृत स्वास्थ्य सेवा प्रेषण',

    // Role Labels
    roleASHA: 'आशा / एएनएम कार्यकर्ता',
    roleDOCTOR: 'डॉक्टर / चिकित्सा अधिकारी',
    roleFACILITY_ADMIN: 'अस्पताल प्रशासक',
    roleDISTRICT_MANAGER: 'जिला स्वास्थ्य अधिकारी',
    roleADMIN: 'सिस्टम सुपर एडमिन',

    // Offline / Sync
    online: 'ऑनलाइन',
    offline: 'ऑफ़लाइन',
    pendingSync: 'लंबित सिंक',
    syncNow: 'अभी सिंक करें',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('setucare_lang') as Language;
    if (saved && (saved === 'en' || saved === 'hi')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('setucare_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

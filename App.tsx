import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ModuleId, type Module, type LogEntry, type ChatMessage } from './types';
import { translations } from './i18n';
import { encryptLog, decryptLog, encryptText, decryptText, encryptFile, decryptFile } from './services/cryptoService';

// --- ICONS (as self-contained components) ---
const IconShield = ({className = "h-8 w-8 text-cyan"}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.917l.004.004a12.02 12.02 0 0017.992 0l.004-.004A12.02 12.02 0 0021.618 7.984z" /></svg>;
const IconHome = ({className = "h-6 w-6"}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>;
const IconThreat = ({className = "h-6 w-6"}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const IconPassword = ({className = "h-6 w-6"}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.623 5.882M9 13.182A6.001 6.001 0 004 17a6 6 0 004.478 5.84M12 12a3 3 0 100-6 3 3 0 000 6z" /></svg>;
const IconBruteForce = ({className = "h-6 w-6"}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10.5a.5.5 0 01.5-.5h3a.5.5 0 010 1h-3a.5.5 0 01-.5-.5z" /></svg>;
const IconRansomware = ({className = "h-6 w-6"}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const IconAES = ({className = "h-6 w-6"}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-1.026.977-2.206.977-3.434m-2.176-1.153a9.973 9.973 0 00-2.176-1.153M12 11a4 4 0 118 0 4 4 0 01-8 0z" /></svg>;
const IconChat = ({className = "h-6 w-6"}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const IconAdmin = ({className = "h-6 w-6"}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h2a4 4 0 014 4v2m-6 4h.01M9 17H5.226a2 2 0 01-1.986-2.316l1.242-6.21a2 2 0 011.986-1.684h11.096a2 2 0 011.986 1.684l1.242 6.21A2 2 0 0118.774 15H15M9 17h6" /></svg>;
const IconFile = ({className = "h-6 w-6 text-cyan"}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const IconLock = ({className = "h-6 w-6 text-red-danger"}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;


// --- CONSTANTS & DATA ---
const MODULES: Module[] = [
  { id: ModuleId.THREAT_ID, titleKey: 'module_threat_id_title', descriptionKey: 'module_threat_id_desc', icon: IconThreat },
  { id: ModuleId.PASSWORD, titleKey: 'module_password_title', descriptionKey: 'module_password_desc', icon: IconPassword },
  { id: ModuleId.BRUTE_FORCE, titleKey: 'module_brute_force_title', descriptionKey: 'module_brute_force_desc', icon: IconBruteForce },
  { id: ModuleId.RANSOMWARE, titleKey: 'module_ransomware_title', descriptionKey: 'module_ransomware_desc', icon: IconRansomware },
  { id: ModuleId.AES_DEMO, titleKey: 'module_aes_demo_title', descriptionKey: 'module_aes_demo_desc', icon: IconAES },
  { id: ModuleId.CHATBOT, titleKey: 'module_chatbot_title', descriptionKey: 'module_chatbot_desc', icon: IconChat },
  { id: ModuleId.ADMIN, titleKey: 'module_admin_title', descriptionKey: 'module_admin_desc', icon: IconAdmin },
];

const CHATBOT_KNOWLEDGE_BASE: Record<string, {keywords: string[], response: string}> = {
    phishing: { keywords: ["phishing", "fake email", "scam", "unsolicited"], response: "Phishing is a cyber attack where attackers, disguised as a trustworthy entity, trick people into revealing sensitive information like passwords and credit card numbers. Key signs are suspicious sender emails, generic greetings, spelling errors, and a sense of urgency." },
    password: { keywords: ["password", "credential", "passkey", "strong password"], response: "A strong password is long (12+ characters), using a mix of uppercase letters, lowercase letters, numbers, and symbols. Avoid personal info or common words. Using a password manager is highly recommended to create and store unique, strong passwords for every account." },
    ransomware: { keywords: ["ransomware", "encrypt", "locker"], response: "Ransomware is malicious software that encrypts your files, making them inaccessible. Attackers then demand a ransom (usually in cryptocurrency) for the decryption key. The best defenses are regular offline backups, caution with downloads/attachments, and keeping software updated." },
    "2fa": { keywords: ["2fa", "mfa", "two factor", "multi-factor", "authentication"], response: "Two-Factor Authentication (2FA) or Multi-Factor Authentication (MFA) adds a second layer of security to your accounts. After entering your password, you must provide a second piece of information, like a code from your phone app, an SMS, or a physical key. This makes it much harder for attackers to get in, even if they steal your password." },
    malware: { keywords: ["malware", "virus", "trojan", "spyware", "adware"], response: "Malware (malicious software) is a broad term for any software intentionally designed to cause damage to a computer, server, client, or computer network. This includes viruses, worms, Trojan horses, ransomware, spyware, and more. A good antivirus program is essential for protection." },
    "social engineering": { keywords: ["social engineering", "manipulation", "pretexting"], response: "Social engineering is the art of manipulating people into giving up confidential information. Unlike traditional hacking, it relies on psychological tricks rather than technical exploits. Phishing is the most common form of social engineering." },
    firewall: { keywords: ["firewall", "network security"], response: "A firewall is a network security device that monitors incoming and outgoing network traffic and decides whether to allow or block specific traffic based on a defined set of security rules. It acts as a barrier between a trusted network and an untrusted network, like the internet." },
    wifi: { keywords: ["wifi", "wi-fi", "wireless", "router security"], response: "To secure your home Wi-Fi, you should: 1. Change the default router admin password. 2. Use WPA3 or WPA2 encryption. 3. Create a strong, unique Wi-Fi password. 4. Disable WPS (Wi-Fi Protected Setup). 5. Keep your router's firmware updated." },
};

type TFunction = (key: string, options?: Record<string, string | number>) => string;
type AddLogFunction = (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;

// --- HELPER & LAYOUT COMPONENTS ---
const Button: React.FC<{ onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void; children: React.ReactNode; className?: string; disabled?: boolean; variant?: 'primary' | 'danger' }> = ({ onClick, children, className = '', disabled = false, variant = 'primary' }) => {
  const baseClasses = 'font-bold py-2 px-6 rounded-lg transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed';
  const variantClasses = {
    primary: 'bg-cyan text-primary hover:bg-highlight hover:text-white',
    danger: 'bg-red-danger text-white hover:bg-red-700'
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Sidebar: React.FC<{ activeModuleId: ModuleId | null; onModuleClick: (id: ModuleId | null) => void; t: TFunction }> = ({ activeModuleId, onModuleClick, t }) => {
  return (
    <aside className="w-64 bg-secondary flex-shrink-0 flex flex-col p-4">
      <div className="flex items-center mb-8">
        <IconShield className="h-10 w-10 mr-3"/>
        <h1 className="text-2xl font-bold">{t('app_title')}</h1>
      </div>
      <nav className="flex flex-col space-y-2">
        <button
          onClick={() => onModuleClick(null)}
          className={`flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${!activeModuleId ? 'bg-accent text-white' : 'hover:bg-accent/50'}`}
        >
          <IconHome/>
          <span>Dashboard</span>
        </button>
        <hr className="border-accent my-2"/>
        {MODULES.map(module => (
          <button
            key={module.id}
            onClick={() => onModuleClick(module.id)}
            className={`flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${activeModuleId === module.id ? 'bg-accent text-white' : 'hover:bg-accent/50'}`}
          >
            <module.icon/>
            <span>{t(module.titleKey)}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

const MainContentHeader: React.FC<{ title: string; onLanguageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; language: string; t: TFunction }> = ({ title, onLanguageChange, language, t }) => {
    return (
        <header className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-text-primary">{title}</h2>
            <div className="flex items-center space-x-4 bg-secondary p-2 rounded-lg">
                <div className="relative">
                    <label htmlFor="language-select" className="sr-only">{t('toggle_language')}</label>
                    <select id="language-select" onChange={onLanguageChange} value={language} className="bg-transparent appearance-none focus:outline-none pr-6">
                        <option value="en">English</option>
                        <option value="ta">தமிழ்</option>
                        <option value="te">తెలుగు</option>
                        <option value="hi">हिन्दी</option>
                        <option value="ml">മലയാളം</option>
                    </select>
                </div>
                <span className="font-mono text-text-secondary">{new Date().toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </header>
    );
};

// --- MODULE COMPONENTS ---
const Dashboard: React.FC<{ onModuleClick: (id: ModuleId) => void; t: TFunction }> = ({ onModuleClick, t }) => {
    return (
        <div className="animate-fade-in">
            <h3 className="text-2xl font-bold text-cyan mb-2">{t('dashboard_title')}</h3>
            <p className="text-text-secondary mb-8">{t('dashboard_intro')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MODULES.map(module => (
                    <div key={module.id} className="bg-secondary p-6 rounded-lg border border-accent flex flex-col">
                        <div className="flex items-center mb-3">
                            <module.icon className="h-8 w-8 text-cyan mr-4" />
                            <h4 className="text-xl font-bold">{t(module.titleKey)}</h4>
                        </div>
                        <p className="text-text-secondary flex-grow mb-4">{t(module.descriptionKey)}</p>
                        <Button onClick={() => onModuleClick(module.id)} className="w-full mt-auto">{t('launch_module')}</Button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ThreatIdentification: React.FC<{ addLog: AddLogFunction; t: TFunction }> = ({ addLog, t }) => {
    const [stage, setStage] = useState<'briefing' | 'email' | 'url' | 'page' | 'summary'>('briefing');
    const [foundFlags, setFoundFlags] = useState<number[]>([]);
    const [urlVerdict, setUrlVerdict] = useState<'safe' | 'malicious' | null>(null);
    const [pageFlags, setPageFlags] = useState<number[]>([]);
    const [missionSuccess, setMissionSuccess] = useState(false);
    
    const EMAIL_FLAGS = [1, 2, 3, 4, 5];
    const PAGE_FLAGS_DATA = [1, 2, 3, 4];
    
    const toggleFlag = (flagId: number) => {
        setFoundFlags(prev => prev.includes(flagId) ? prev.filter(f => f !== flagId) : [...prev, flagId]);
    };

    const togglePageFlag = (flagId: number) => {
        setPageFlags(prev => prev.includes(flagId) ? prev.filter(f => f !== flagId) : [...prev, flagId]);
    }
    
    const handleUrlChoice = (choice: 'safe' | 'malicious') => {
        setUrlVerdict(choice);
        const isCorrect = choice === 'malicious';
        const resultText = isCorrect ? t('threat_url_correct') : t('threat_url_incorrect');
        alert(resultText);
        if(isCorrect) {
            setTimeout(() => setStage('page'), 1500);
        } else {
             setTimeout(() => setStage('summary'), 1500);
        }
    };

    const finishMission = () => {
        const emailScore = foundFlags.length;
        const urlScore = urlVerdict === 'malicious' ? 1 : 0;
        const pageScore = pageFlags.length;
        const totalScore = emailScore + urlScore * 5 + pageScore; // Weighting scores
        const success = totalScore > 8;
        setMissionSuccess(success);
        addLog({
            moduleId: ModuleId.THREAT_ID,
            userResponse: `Mission Complete: ${success ? 'Success' : 'Failed'}`,
            data: { emailFlags: foundFlags, urlVerdict, pageFlags, totalScore },
        });
        setStage('summary');
    }

    if (stage === 'briefing') return <div className="text-center flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold text-cyan mb-4">{t('threat_mission_briefing')}</h2>
        <p className="max-w-prose mb-6">{t('threat_mission_intro')}</p>
        <div className="space-y-2 text-left bg-primary p-4 rounded-lg">
            <p><strong>{t('threat_stage_1')}</strong></p>
            <p><strong>{t('threat_stage_2')}</strong></p>
            <p><strong>{t('threat_stage_3')}</strong></p>
        </div>
        <Button onClick={() => setStage('email')} className="mt-8">{t('threat_start_mission')}</Button>
    </div>

    if (stage === 'email') return <div className="h-full flex flex-col">
        <h3 className="text-xl font-bold mb-2">{t('threat_stage_1')}</h3>
        <p className="text-text-secondary mb-4">{t('threat_email_instructions')}</p>
        <div className="bg-primary p-4 rounded-lg flex-grow relative border border-accent">
            {/* Mock Email UI */}
            <div className="font-sans text-sm">
                <p className="mb-2"><strong>{t('threat_email_subject')}</strong></p>
                <p className="text-text-secondary mb-4 cursor-pointer" onClick={() => toggleFlag(2)}>{t('threat_email_sender')}</p>
                <hr className="border-accent my-3" />
                <p className="mb-4 cursor-pointer" onClick={() => toggleFlag(3)}>{t('threat_email_greeting')}</p>
                <p className="mb-4 cursor-pointer" onClick={() => toggleFlag(4)}>{t('threat_email_body_1')}</p>
                <p className="mb-6 cursor-pointer" onClick={() => toggleFlag(5)}>{t('threat_email_body_2')}</p>
                <div className="text-center mb-6">
                    <span className="bg-blue-600 text-white font-bold py-3 px-6 rounded-md cursor-pointer">{t('threat_email_button')}</span>
                </div>
                <p className="cursor-pointer" onClick={() => toggleFlag(1)}>{t('threat_email_signature')}</p>
            </div>
            {/* Flags Explanations */}
            <div className="absolute top-4 right-4 bg-secondary p-3 rounded-lg w-64">
                <h4 className="font-bold border-b border-accent pb-2 mb-2">{t('threat_red_flags_found', { found: foundFlags.length, total: EMAIL_FLAGS.length })}</h4>
                <ul className="text-xs space-y-2">
                    {EMAIL_FLAGS.map(flag => <li key={flag} className={`transition-opacity ${foundFlags.includes(flag) ? 'opacity-100' : 'opacity-30'}`}>
                       {t(`threat_flag_${flag}_desc`)}
                    </li>)}
                </ul>
            </div>
        </div>
        <div className="mt-4 text-right">
            <Button onClick={() => setStage('url')} disabled={foundFlags.length < 3}>{t('threat_proceed_stage_2')}</Button>
        </div>
    </div>

    if (stage === 'url') return <div className="text-center flex flex-col items-center justify-center h-full">
         <h3 className="text-xl font-bold mb-2">{t('threat_stage_2')}</h3>
         <p className="text-text-secondary mb-4">{t('threat_url_instructions')}</p>
         <div className="bg-primary font-mono text-lg p-3 rounded-lg mb-6 w-full text-left overflow-x-auto">
             {t('threat_url_address')}
         </div>
         <div className="bg-primary p-4 rounded-lg w-full text-left mb-6">
            <h4 className="text-lg font-bold text-cyan mb-2">{t('threat_url_analysis')}</h4>
            <ul className="space-y-2">
                <li><strong>{t('threat_url_protocol')}:</strong> {t('threat_url_protocol_desc')}</li>
                <li><strong>{t('threat_url_subdomain')}:</strong> {t('threat_url_subdomain_desc')}</li>
                <li className="text-yellow-warn"><strong>{t('threat_url_domain')}:</strong> {t('threat_url_domain_desc')}</li>
            </ul>
         </div>
         <p className="font-bold mb-4">{t('threat_is_url_safe')}</p>
         <div className="flex space-x-4">
            <Button onClick={() => handleUrlChoice('malicious')} variant='danger'>{t('threat_no')}</Button>
            <Button onClick={() => handleUrlChoice('safe')}>{t('threat_yes')}</Button>
         </div>
    </div>

     if (stage === 'page') return <div className="h-full flex flex-col">
        <h3 className="text-xl font-bold mb-2">{t('threat_stage_3')}</h3>
        <p className="text-text-secondary mb-4">{t('threat_page_instructions')}</p>
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-primary p-4 rounded-lg border border-accent">
                {/* Mock Page UI */}
                <div className="h-8 bg-accent rounded-t-md flex items-center px-3 space-x-2">
                    <span className="h-3 w-3 bg-red-500 block rounded-full"></span>
                    <span className="h-3 w-3 bg-yellow-500 block rounded-full"></span>
                    <span className="h-3 w-3 bg-green-500 block rounded-full"></span>
                </div>
                <div className="bg-gray-200 text-gray-800 p-2 text-sm">
                    <span className="text-red-600">(!) Not Secure | </span>{t('threat_url_address')}
                </div>
                <div className="bg-white text-black p-8 text-center">
                    <img src="https://via.placeholder.com/150x50/003087/ffffff.png?text=PayPaI" alt="PayPal logo" className="mx-auto mb-4 opacity-80" />
                    <input type="email" placeholder="Email" className="border p-2 w-full mb-3" />
                    <input type="password" placeholder="Password" className="border p-2 w-full mb-3" />
                    <input type="text" placeholder="Social Security Number" className="border p-2 w-full mb-3" />
                    <button className="bg-blue-800 text-white p-2 w-full rounded-full">Log In</button>
                    <div className="mt-4 text-xs text-gray-500">
                        <span>Contact Us</span> | <span>Privacy</span> | <span>Legal</span>
                    </div>
                </div>
            </div>
            <div className="bg-primary p-4 rounded-lg border border-accent">
                <h4 className="font-bold border-b border-accent pb-2 mb-2">{t('threat_red_flags_found', { found: pageFlags.length, total: PAGE_FLAGS_DATA.length })}</h4>
                <div className="space-y-3">
                    {PAGE_FLAGS_DATA.map(flag => <label key={flag} className="flex items-center cursor-pointer">
                        <input type="checkbox" className="h-5 w-5 rounded mr-3" checked={pageFlags.includes(flag)} onChange={() => togglePageFlag(flag)} />
                        <span>{t(`threat_page_flag_${flag}`)}</span>
                    </label>)}
                </div>
            </div>
        </div>
        <div className="mt-4 text-right">
            <Button onClick={finishMission}>{t('threat_page_submit_analysis')}</Button>
        </div>
    </div>

    if (stage === 'summary') return <div className="text-center flex flex-col items-center justify-center h-full">
        <h2 className={`text-3xl font-bold mb-4 ${missionSuccess ? 'text-green-success' : 'text-red-danger'}`}>
            {missionSuccess ? t('threat_mission_complete') : t('threat_mission_failed')}
        </h2>
        <p className="max-w-prose mb-6">
            {missionSuccess ? t('threat_mission_summary') : t('threat_mission_failed_summary')}
        </p>
        <Button onClick={() => {
            setStage('briefing');
            setFoundFlags([]);
            setUrlVerdict(null);
            setPageFlags([]);
        }}>{t('try_again')}</Button>
    </div>
    
    return null;
};

const PasswordStrength: React.FC<{ addLog: AddLogFunction; t: TFunction }> = ({ addLog, t }) => {
    const [password, setPassword] = useState('');

    const analysis = useMemo(() => {
        const pass = password || '';
        const score = {
            length: pass.length >= 12,
            uppercase: /[A-Z]/.test(pass),
            lowercase: /[a-z]/.test(pass),
            numbers: /\d/.test(pass),
            symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass),
        };
        
        let strengthScore = 0;
        if (pass.length >= 8) strengthScore++;
        if (pass.length >= 12) strengthScore++;
        if (score.uppercase && score.lowercase) strengthScore++;
        if (score.numbers) strengthScore++;
        if (score.symbols) strengthScore++;
        
        const feedbackMap = [
            { text: t('password_feedback_weak'), color: 'bg-red-danger' },
            { text: t('password_feedback_weak'), color: 'bg-red-danger' },
            { text: t('password_feedback_medium'), color: 'bg-orange-medium' },
            { text: t('password_feedback_strong'), color: 'bg-yellow-warn' },
            { text: t('password_feedback_strong'), color: 'bg-green-success' },
            { text: t('password_feedback_very_strong'), color: 'bg-green-success' },
        ];
        
        const feedback = feedbackMap[strengthScore];
        const strengthPercent = (strengthScore / 5) * 100;
        
        // Simplified entropy calculation for crack time
        let charsetSize = 0;
        if (score.lowercase) charsetSize += 26;
        if (score.uppercase) charsetSize += 26;
        if (score.numbers) charsetSize += 10;
        if (score.symbols) charsetSize += 32;
        
        const combinations = Math.pow(charsetSize, pass.length);
        const guessesPerSecond = 1e9; // Assume 1 billion guesses/sec
        const secondsToCrack = combinations / guessesPerSecond;
        
        let timeToCrack = t('time_instant');
        if (secondsToCrack > 3153600000) timeToCrack = t('time_centuries');
        else if (secondsToCrack > 31536000) timeToCrack = `${Math.round(secondsToCrack / 31536000)} ${t('time_years')}`;
        else if (secondsToCrack > 86400) timeToCrack = `${Math.round(secondsToCrack / 86400)} ${t('time_days')}`;
        else if (secondsToCrack > 3600) timeToCrack = `${Math.round(secondsToCrack / 3600)} ${t('time_hours')}`;
        else if (secondsToCrack > 60) timeToCrack = `${Math.round(secondsToCrack / 60)} ${t('time_minutes')}`;
        else if (secondsToCrack > 1) timeToCrack = `${Math.round(secondsToCrack)} ${t('time_seconds')}`;
        
        return { score, feedback, strengthPercent, timeToCrack };
    }, [password, t]);
    
    return <div className="flex flex-col h-full">
        <input
            type="text"
            className="w-full p-4 bg-primary border-2 border-accent rounded-lg text-2xl text-center font-mono focus:outline-none focus:border-cyan"
            placeholder={t('password_placeholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
        />
        <div className="my-6">
            <div className="flex justify-between items-center mb-2">
                <span className="font-bold">{t('password_strength')}:</span>
                <span className="font-bold" style={{color: analysis.feedback.color.replace('bg-', '')}}>{analysis.feedback.text}</span>
            </div>
            <div className="w-full bg-primary rounded-full h-4">
                <div className={`h-4 rounded-full ${analysis.feedback.color} transition-all duration-300`} style={{width: `${analysis.strengthPercent}%`}}></div>
            </div>
        </div>
        <div className="text-center bg-primary p-4 rounded-lg mb-6">
            <p className="text-text-secondary">{t('password_time_to_crack')}</p>
            <p className="text-3xl font-bold text-cyan">{password ? analysis.timeToCrack : '-'}</p>
        </div>
        <div className="flex-grow bg-primary p-4 rounded-lg">
            <ul className="space-y-2">
                {[ 'length', 'uppercase', 'lowercase', 'numbers', 'symbols'].map(key => {
                    const hasPassed = analysis.score[key as keyof typeof analysis.score];
                    return <li key={key} className={`flex items-center transition-colors ${hasPassed ? 'text-green-success' : 'text-text-secondary'}`}>
                        {hasPassed ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>}
                        <span>{t(`password_tip_${key}`)}</span>
                    </li>
                })}
            </ul>
        </div>
    </div>
};

const BruteForceDemo: React.FC<{ addLog: AddLogFunction; t: TFunction }> = ({ addLog, t }) => {
    const [password, setPassword] = useState('');
    const [charset, setCharset] = useState<'numeric' | 'alnum' | 'full'>('numeric');
    const [isAttacking, setIsAttacking] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [display, setDisplay] = useState('---');
    const [resultMessage, setResultMessage] = useState('');
    const attackInterval = useRef<number | null>(null);

    const charsets = useMemo(() => ({
        numeric: '0123456789',
        alnum: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        full: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:",./<>?'
    }), []);

    const stopAttack = (cracked: boolean, startTime: number, finalAttempts: number) => {
        if (attackInterval.current) {
            clearInterval(attackInterval.current);
            attackInterval.current = null;
        }
        setIsAttacking(false);
        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);

        if (cracked) {
            setResultMessage(t('brute_force_result_cracked', { password: password, time: timeTaken }));
            setDisplay(password);
        } else {
            setResultMessage(t('brute_force_result_failed'));
            setDisplay('TOO STRONG');
        }
        addLog({ moduleId: ModuleId.BRUTE_FORCE, userResponse: password, data: { cracked, charset, attempts: finalAttempts, timeTaken } });
    };

    const startAttack = () => {
        if (!password || isAttacking) return;
        
        setIsAttacking(true);
        setResultMessage(t('brute_force_cracking'));
        setDisplay('');
        setAttempts(0);

        let currentAttempts = 0;
        const startTime = Date.now();

        attackInterval.current = window.setInterval(() => {
            currentAttempts += 50000; // Simulate larger batches for speed
            setAttempts(currentAttempts);

            const maxSimulatedAttempts = 1000000;
            const passwordComplexity = Math.pow(charsets[charset].length, password.length);

            if (passwordComplexity <= maxSimulatedAttempts) {
                if (currentAttempts >= passwordComplexity) {
                    stopAttack(true, startTime, Math.ceil(passwordComplexity));
                }
            } else {
                if (currentAttempts >= maxSimulatedAttempts) {
                    stopAttack(false, startTime, currentAttempts);
                }
            }
        }, 50);
    };
    
    useEffect(() => {
        return () => {
            if (attackInterval.current) clearInterval(attackInterval.current);
        }
    }, []);

    const searchSpace = useMemo(() => {
        if (!password) return '0';
        const space = Math.pow(charsets[charset].length, password.length);
        if (space > 1e15 || !isFinite(space)) return space.toExponential(2);
        return space.toLocaleString();
    }, [password, charset, charsets]);

    return <div className="h-full flex flex-col">
        <div className="bg-primary p-4 rounded-lg mb-4">
            <p className="mb-2">{t('brute_force_prompt')}</p>
            <div className="flex gap-4">
                <input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('password_placeholder')} className="flex-grow p-2 bg-secondary border border-accent rounded-md focus:outline-none focus:border-cyan" disabled={isAttacking}/>
                <select value={charset} onChange={e => setCharset(e.target.value as any)} className="p-2 bg-secondary border border-accent rounded-md focus:outline-none focus:border-cyan" disabled={isAttacking}>
                    <option value="numeric">{t('brute_force_set_numeric')}</option>
                    <option value="alnum">{t('brute_force_set_alnum')}</option>
                    <option value="full">{t('brute_force_set_full')}</option>
                </select>
                <Button onClick={isAttacking ? () => stopAttack(false, Date.now(), attempts) : startAttack} disabled={!password}>
                    {isAttacking ? t('brute_force_stop') : t('brute_force_start')}
                </Button>
            </div>
        </div>
        <div className="flex-grow bg-primary rounded-lg p-4 flex flex-col items-center justify-center">
            <div className="w-full text-center mb-4">
                <p className="text-text-secondary">{t('brute_force_possibilities', { count: searchSpace })}</p>
            </div>
            <div className="font-mono text-4xl h-12 w-full text-center overflow-hidden">
                {isAttacking 
                    ? <span className="text-cyan">{password.split('').map((c, i) => <span key={i} className="animate-pulse">{charsets[charset][Math.floor(Math.random() * charsets[charset].length)]}</span>)}</span>
                    : <span className={resultMessage.includes('cracked') ? 'text-green-success' : 'text-red-danger'}>{display}</span>
                }
            </div>
            <div className="mt-4 text-center h-6">
                <p>{resultMessage}</p>
            </div>
            <div className="mt-4 text-center">
                <span className="text-text-secondary">{t('brute_force_attempts')} </span>
                <span className="font-mono text-2xl">{attempts.toLocaleString()}</span>
            </div>
        </div>
    </div>
};

const RansomwareSim: React.FC<{ addLog: AddLogFunction; t: TFunction }> = ({ addLog, t }) => {
    type File = { name: string; originalName: string, encrypted: boolean; icon: 'file' | 'lock' };
    const initialFiles: File[] = useMemo(() => [
        { name: 'Family_Photos.zip', originalName: 'Family_Photos.zip', encrypted: false, icon: 'file' },
        { name: 'Taxes_2023.xlsx', originalName: 'Taxes_2023.xlsx', encrypted: false, icon: 'file' },
        { name: 'Project_Thesis.docx', originalName: 'Project_Thesis.docx', encrypted: false, icon: 'file' },
        { name: 'Vacation_Video.mp4', originalName: 'Vacation_Video.mp4', encrypted: false, icon: 'file' },
        { name: 'Free_Game_Installer.exe', originalName: 'Free_Game_Installer.exe', encrypted: false, icon: 'file' },
        { name: 'Resume.pdf', originalName: 'Resume.pdf', encrypted: false, icon: 'file' },
    ], []);
    
    const [files, setFiles] = useState<File[]>(initialFiles);
    const [simState, setSimState] = useState<'idle' | 'encrypting' | 'finished'>('idle');

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const runExploit = async () => {
        if (simState !== 'idle') return;
        setSimState('encrypting');
        addLog({moduleId: ModuleId.RANSOMWARE, userResponse: 'Ran exploit', data: {}});
        
        const filesToEncrypt = files.filter(f => !f.name.endsWith('.exe'));

        for (const file of filesToEncrypt) {
            await sleep(400);
            setFiles(prevFiles => prevFiles.map(f => 
                f.originalName === file.originalName 
                ? { ...f, name: `${f.originalName}.SIVA`, encrypted: true, icon: 'lock' }
                : f
            ));
        }
        
        await sleep(500); // Pause for effect
        setSimState('finished');
    };

    const resetSim = () => {
        setFiles(initialFiles);
        setSimState('idle');
    };
    
    return <div className="h-full flex flex-col">
        {simState === 'finished' && <div className="absolute inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center text-center p-8 animate-fade-in">
            <h1 className="text-5xl font-bold text-red-danger font-mono mb-4">{t('ransomware_note_title')}</h1>
            <p className="text-lg text-text-primary max-w-prose mb-6">{t('ransomware_note_body')}</p>
            <div className="bg-secondary p-6 rounded-lg w-full max-w-2xl">
                <h3 className="text-2xl font-bold text-cyan mb-3">{t('ransomware_prevention_title')}</h3>
                <ul className="text-left space-y-2">
                    <li><strong>1. {t('ransomware_prevention_tip_1')}</strong></li>
                    <li><strong>2. {t('ransomware_prevention_tip_2')}</strong></li>
                    <li><strong>3. {t('ransomware_prevention_tip_3')}</strong></li>
                </ul>
            </div>
            <Button onClick={resetSim} className="mt-8">{t('try_again')}</Button>
        </div>}
        
        <h3 className="text-xl font-bold mb-4">{t('ransomware_file_explorer')}</h3>
        <div className="flex-grow bg-primary p-4 rounded-lg grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map(file => (
                <div key={file.originalName} className="text-center p-2 rounded-md">
                    {file.icon === 'file' ? <IconFile className="h-16 w-16 mx-auto" /> : <IconLock className="h-16 w-16 mx-auto" />}
                    <p className={`mt-2 text-sm break-words ${file.encrypted ? 'text-red-danger' : ''}`}>{file.name}</p>
                </div>
            ))}
        </div>
        <div className="mt-4 text-center p-2 bg-primary rounded-lg h-12 flex items-center justify-center">
            {simState === 'encrypting' && <p className="text-red-danger font-bold animate-pulse">{t('ransomware_encrypting')}</p>}
            {simState === 'idle' && (
                <Button onClick={runExploit} variant="danger">
                    {t('ransomware_run_exploit')}
                </Button>
            )}
        </div>
    </div>
};

const AESDemo: React.FC<{ addLog: AddLogFunction; t: TFunction }> = ({ addLog, t }) => {
    const [text, setText] = useState('SivaShield');
    const [key, setKey] = useState('SuperSecretKey');
    const [encryptedText, setEncryptedText] = useState('');
    const [decryptedText, setDecryptedText] = useState('');
    const [error, setError] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleTextEncrypt = () => {
        const encrypted = encryptText(text, key);
        if(encrypted) {
            setEncryptedText(encrypted);
            setDecryptedText('');
            setError('');
            addLog({moduleId: ModuleId.AES_DEMO, userResponse: 'Encrypt text', data: { textLength: text.length, keyLength: key.length }});
        }
    };
    
    const handleTextDecrypt = () => {
        const decrypted = decryptText(encryptedText, key);
        if(decrypted !== null) {
            setDecryptedText(decrypted);
            setError('');
        } else {
            setDecryptedText('');
            setError(t('aes_error'));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };
    
    const downloadBlob = (blob: Blob, fileName: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    const handleFileEncrypt = async () => {
        if (!file || !key) return;
        setIsProcessing(true);
        const encryptedBlob = await encryptFile(file, key);
        if(encryptedBlob) {
            downloadBlob(encryptedBlob, `${file.name}.siva`);
            addLog({moduleId: ModuleId.AES_DEMO, userResponse: 'Encrypt file', data: { fileName: file.name, fileSize: file.size }});
        }
        setIsProcessing(false);
    };

    const handleFileDecrypt = async () => {
        if (!file || !key) return;
        setIsProcessing(true);
        const decryptedBlob = await decryptFile(file, key);
        if(decryptedBlob) {
             downloadBlob(decryptedBlob, file.name.replace('.siva', ''));
        } else {
             alert(t('aes_error'));
        }
        setIsProcessing(false);
    }

    const textToBlocks = (str: string, blockSize = 8) => str.match(new RegExp(`.{1,${blockSize}}`, 'g')) || [];
    const plainBlocks = textToBlocks(text);
    const encryptedBlocks = textToBlocks(encryptedText.substring(0, 40) + '...', 10);
    
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
        <div className="bg-primary p-4 rounded-lg flex flex-col">
            <h3 className="text-lg font-bold text-cyan mb-2">{t('aes_visualizer')}</h3>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs text-center flex-grow mb-4">
                <div className="bg-secondary p-2 rounded">
                    <h4 className="font-bold mb-2">{t('aes_plaintext_blocks')}</h4>
                    <div className="space-y-1">{plainBlocks.map((b,i) => <div key={i} className="bg-primary p-1 rounded">{b}</div>)}</div>
                </div>
                 <div className="bg-secondary p-2 rounded">
                    <h4 className="font-bold mb-2">{t('aes_ciphertext_blocks')}</h4>
                    <div className="space-y-1">{encryptedBlocks.map((b,i) => <div key={i} className="bg-red-900/50 p-1 rounded break-words">{b}</div>)}</div>
                </div>
            </div>
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder={t('aes_input_text')} className="w-full p-2 bg-secondary border border-accent rounded-md h-20 mb-2"/>
            <input type="text" value={key} onChange={e=>setKey(e.target.value)} placeholder={t('aes_key')} className="w-full p-2 bg-secondary border border-accent rounded-md mb-2"/>
            <div className="flex gap-2 mb-4">
                <Button onClick={handleTextEncrypt} className="flex-1">{t('aes_encrypt')}</Button>
                <Button onClick={handleTextDecrypt} className="flex-1">{t('aes_decrypt')}</Button>
            </div>
            <textarea readOnly value={encryptedText} placeholder={t('aes_encrypted_text')} className="w-full p-2 bg-secondary border border-accent rounded-md h-20 font-mono text-xs mb-2"/>
            <input readOnly value={decryptedText || error} placeholder={t('aes_decrypted_text')} className={`w-full p-2 bg-secondary border border-accent rounded-md ${error ? 'text-red-danger' : ''}`}/>
        </div>
        <div className="bg-primary p-4 rounded-lg flex flex-col items-center justify-center">
             <h3 className="text-lg font-bold text-cyan mb-4">{t('aes_file_section_title')}</h3>
             <label className="w-full text-center border-2 border-dashed border-accent rounded-lg p-8 cursor-pointer hover:border-cyan hover:bg-secondary transition-colors">
                <span className="text-text-secondary">{file ? t('aes_file_info', {fileName: file.name, fileSize: file.size}) : t('aes_upload_file')}</span>
                <input type="file" className="hidden" onChange={handleFileChange} />
             </label>
             <input type="text" value={key} onChange={e=>setKey(e.target.value)} placeholder={t('aes_key')} className="w-full p-3 bg-secondary border border-accent rounded-md my-4"/>
             <div className="flex gap-4 w-full">
                <Button onClick={handleFileEncrypt} className="flex-1" disabled={!file || isProcessing}>{t('aes_encrypt_file')}</Button>
                <Button onClick={handleFileDecrypt} className="flex-1" disabled={!file || isProcessing}>{t('aes_decrypt_file')}</Button>
             </div>
             {isProcessing && <p className="mt-4 animate-pulse">{t('chatbot_typing')}</p>}
        </div>
    </div>
};

const ChatbotSim: React.FC<{ addLog: AddLogFunction; t: TFunction }> = ({ addLog, t }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([{ sender: 'bot', text: t('chatbot_welcome') }]);
    const [userInput, setUserInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const getBotResponse = (input: string): string => {
        const lowerInput = input.toLowerCase();
        for (const topic in CHATBOT_KNOWLEDGE_BASE) {
            const { keywords, response } = CHATBOT_KNOWLEDGE_BASE[topic];
            if (keywords.some(kw => lowerInput.includes(kw))) {
                return response;
            }
        }
        return t('chatbot_fallback');
    };
    
    const handleSendMessage = () => {
        if (userInput.trim() === '' || isTyping) return;
        const userMessage: ChatMessage = { sender: 'user', text: userInput };
        setMessages(prev => [...prev, userMessage]);
        setIsTyping(true);
        
        setTimeout(() => {
            const botResponse = getBotResponse(userInput);
            const botMessage: ChatMessage = { sender: 'bot', text: botResponse };
            setMessages(prev => [...prev, botMessage]);
            addLog({moduleId: ModuleId.CHATBOT, userResponse: userInput, data: {response: botResponse}});
            setIsTyping(false);
        }, 1200);

        setUserInput('');
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="h-full flex flex-col">
            <div className="flex-grow bg-primary p-4 rounded-lg overflow-y-auto mb-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex mb-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-lg px-4 py-2 max-w-md animate-fade-in ${msg.sender === 'user' ? 'bg-cyan text-primary' : 'bg-accent'}`}>
                           {msg.text}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-accent rounded-lg px-4 py-2 inline-flex items-center">
                            <span className="text-sm mr-2">{t('chatbot_typing')}</span>
                            <div className="flex space-x-1">
                                <span className="h-2 w-2 bg-text-secondary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-text-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-text-secondary rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <div className="flex">
                <input 
                    type="text" 
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder={t('chatbot_placeholder')}
                    className="w-full p-3 bg-primary border-2 border-accent rounded-l-lg text-text-primary focus:outline-none focus:border-cyan"
                    disabled={isTyping}
                />
                <Button onClick={handleSendMessage} className="rounded-l-none" disabled={isTyping}>{t('submit')}</Button>
            </div>
        </div>
    );
};

const AdminDashboard: React.FC<{ logs: LogEntry[]; setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>; t: TFunction }> = ({ logs, setLogs, t }) => {
    const clearLogs = () => {
        if(window.confirm('Are you sure you want to delete all logs? This cannot be undone.')){
            setLogs([]);
            localStorage.removeItem('sivashield_logs');
        }
    };

    return <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-cyan">{t('admin_dashboard')}</h2>
            <Button onClick={clearLogs} variant="danger" disabled={logs.length === 0}>
                {t('admin_clear_logs')}
            </Button>
        </div>
        <div className="flex-grow bg-primary rounded-lg overflow-auto">
            {logs.length === 0 ? <p className="text-center p-8">{t('admin_no_logs')}</p> :
            <table className="w-full text-left text-sm">
                <thead className="bg-accent sticky top-0">
                    <tr>
                        <th className="p-3">{t('admin_timestamp')}</th>
                        <th className="p-3">{t('admin_module')}</th>
                        <th className="p-3">{t('admin_response')}</th>
                        <th className="p-3">Data</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-accent">
                    {logs.slice().reverse().map(log => <tr key={log.id}>
                        <td className="p-3 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="p-3">{log.moduleId}</td>
                        <td className="p-3">{log.userResponse}</td>
                        <td className="p-3 font-mono text-xs"><pre>{JSON.stringify(log.data, null, 2)}</pre></td>
                    </tr>)}
                </tbody>
            </table>
            }
        </div>
    </div>
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [language, setLanguage] = useState<'en' | 'ta' | 'te' | 'hi' | 'ml'>('en');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<ModuleId | null>(null);

  const t: TFunction = useCallback((key, options) => {
    let translation = (translations[language] as any)[key] || translations['en'][key as keyof typeof translations.en] || key;
    if(options){
        Object.entries(options).forEach(([k, v]) => {
            translation = translation.replace(`{${k}}`, String(v));
        });
    }
    return translation;
  }, [language]);

  useEffect(() => {
    const encryptedLogs = localStorage.getItem('sivashield_logs');
    if (encryptedLogs) {
        const decrypted = decryptLog<LogEntry[]>(encryptedLogs);
        if (decrypted) setLogs(decrypted);
    }
  }, []);

  const addLog = useCallback<AddLogFunction>((log) => {
    setLogs(prevLogs => {
        const newLog: LogEntry = {
            ...log,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString()
        };
        const updatedLogs = [...prevLogs, newLog];
        localStorage.setItem('sivashield_logs', encryptLog(updatedLogs));
        return updatedLogs;
    });
  }, []);
  
  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      setLanguage(event.target.value as 'en' | 'ta' | 'te' | 'hi' | 'ml');
  };

  const renderModuleComponent = () => {
    if (activeModuleId === null) {
      return <Dashboard onModuleClick={setActiveModuleId} t={t} />;
    }
    switch (activeModuleId) {
      case ModuleId.THREAT_ID: return <ThreatIdentification addLog={addLog} t={t} />;
      case ModuleId.PASSWORD: return <PasswordStrength addLog={addLog} t={t} />;
      case ModuleId.BRUTE_FORCE: return <BruteForceDemo addLog={addLog} t={t} />;
      case ModuleId.RANSOMWARE: return <RansomwareSim addLog={addLog} t={t} />;
      case ModuleId.AES_DEMO: return <AESDemo addLog={addLog} t={t} />;
      case ModuleId.CHATBOT: return <ChatbotSim addLog={addLog} t={t} />;
      case ModuleId.ADMIN: return <AdminDashboard logs={logs} setLogs={setLogs} t={t} />;
      default: return <Dashboard onModuleClick={setActiveModuleId} t={t} />;
    }
  };
  
  const currentModule = activeModuleId ? MODULES.find(m => m.id === activeModuleId) : null;
  const currentTitle = currentModule ? t(currentModule.titleKey) : 'Dashboard';

  return (
    <div className="h-screen w-screen flex bg-primary text-text-primary">
        <Sidebar activeModuleId={activeModuleId} onModuleClick={setActiveModuleId} t={t} />
        <main className="flex-1 flex flex-col p-6 overflow-hidden">
            <MainContentHeader title={currentTitle} onLanguageChange={handleLanguageChange} language={language} t={t} />
            <div className="flex-1 bg-secondary p-6 rounded-lg overflow-auto animate-fade-in">
                {renderModuleComponent()}
            </div>
        </main>
    </div>
  );
}
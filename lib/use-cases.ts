export type UseCaseId = "night-scene" | "station" | "radio-spot";

export interface UseCase {
  id: UseCaseId;
  title: string;
  who: string;
  blurb: string;
  episodeTitle: string;
  language: string;
  script: string;
}

export const USE_CASES: UseCase[] = [
  {
    id: "night-scene",
    title: "Hindi night scene",
    who: "Fiction / audio series",
    blurb: "Three locked voices, rain + door SFX, regenerate one line.",
    episodeTitle: "Rain night",
    language: "hi-IN",
    script: `[SCENE: INT. HOUSE - NIGHT]
[AMBIENCE: RAIN]

[NARRATOR]
बारिश बाहर गिर रही थी। घर के अंदर एक पुरानी घड़ी टिक टिक कर रही थी।

[ARJUN]
कौन है बाहर? इस वक्त?
[EMOTION: tense]

[MEERA]
मैं हूँ, अर्जुन। दरवाज़ा खोलो।

[SFX: DOOR_OPEN]

[NARRATOR]
दरवाज़ा धीरे से खुला। हवा के साथ बारिश का ठंडा पानी अंदर आया।

[ARJUN]
मीरा? तुम भीग गई हो। क्या हुआ?

[MEERA]
वो वापस आ गया है। मैंने उसे गली में देखा।

[ARJUN]
ये मुमकिन नहीं। पुलिस ने कहा था वो शहर छोड़ चुका है।

[MEERA]
मैंने उसकी गाड़ी देखी, अर्जुन। वही लाल स्कूटर।

[SFX: THUNDER]

[NARRATOR]
बाहर गड़गड़ाहट हुई। कमरे की रोशनी एक पल के लिए काँपी।

[ARJUN]
अंदर आओ। दरवाज़ा बंद करो। आज रात कोई बाहर नहीं जाएगा।
`,
  },
  {
    id: "station",
    title: "Station episode",
    who: "Serialized showrunner",
    blurb: "Same Arjun + Meera voices. Continuity is the product.",
    episodeTitle: "Platform three",
    language: "hi-IN",
    script: `[SCENE: EXT. RAILWAY STATION - DAWN]
[AMBIENCE: CROWD]

[NARRATOR]
सुबह के पाँच बजकर पचास मिनट थे। स्टेशन पर रात अभी पूरी तरह गई नहीं थी।

[ARJUN]
तुम पक्का कह रही हो वो इसी ट्रेन से जाएगी?

[MEERA]
मैं पक्का कुछ नहीं कह रही। विक्रम उसी पैटर्न को दोहराता है।

[SFX: FOOTSTEPS]

[NARRATOR]
भीड़ बढ़ने लगी। अर्जुन की निगाह हर नीले बैग पर रुक जाती।

[ARJUN]
वहाँ। बेंच के पास। काला कोट।

[MEERA]
वो नहीं है। कंधे छोटे हैं। विक्रम उससे लंबा है।

[ARJUN]
मैं हर काले कोट को उस जैसा देखने लगा हूँ।

[MEERA]
ये काम का हिस्सा है। हम अगली ट्रेन का इंतज़ार करेंगे।
`,
  },
  {
    id: "radio-spot",
    title: "30s radio spot",
    who: "Ad / YouTuber",
    blurb: "Short, cheap, obvious before and after.",
    episodeTitle: "Script to episode",
    language: "hi-IN",
    script: `[SCENE: RADIO AD]
[AMBIENCE: CROWD]

[NARRATOR]
रात भर की मेहनत। सुबह की चाय। और एक आवाज़ जो रुकती नहीं।

[ANANYA]
तुम्हारी कहानी तैयार है। बस स्क्रिप्ट भेजो।

[SFX: PHONE]

[NARRATOR]
AudioForge. स्क्रिप्ट से एपिसोड। तीन मिनट में।
`,
  },
];

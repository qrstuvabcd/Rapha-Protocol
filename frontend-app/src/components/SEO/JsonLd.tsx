import { useEffect } from 'react'

export function JsonLd() {
    useEffect(() => {
        const scriptId = 'rapha-json-ld'

        // Prevent duplicate injection
        if (document.getElementById(scriptId)) return

        const script = document.createElement('script')
        script.id = scriptId
        script.type = 'application/ld+json'

        const jsonLdData = {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Rapha Protocol",
            "applicationCategory": "MedicalApplication",
            "operatingSystem": "Web, iOS, Android",
            "description": "A decentralized medical data vault allowing patients to own their records and securely share them with AI researchers.",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            },
            "author": {
                "@type": "Person",
                "name": "Yu-Chi Chen",
                "jobTitle": "Medical Student & Founder"
            }
        }

        script.text = JSON.stringify(jsonLdData)
        document.head.appendChild(script)

        return () => {
            // Optional: Cleanup if component unmounts, though usually we want this to persist
            // document.head.removeChild(script)
        }
    }, [])

    return null
}

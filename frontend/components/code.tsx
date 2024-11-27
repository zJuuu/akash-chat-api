import { useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { CopyCheck, CopyIcon } from "lucide-react";

export default function Code({
    code,
    codeStyle,
}: {
    code: string;
    codeStyle: { [key: string]: React.CSSProperties };
}) {
    const [isCopied, setIsCopied] = useState(false);

    const clickCopy = () => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }

    return (
        <div className={"relative rounded-lg border border-#6E7781"}>
            <CopyToClipboard
                onCopy={clickCopy}
                text={code}
            >
                <button type="button" aria-label="Copy to Clipboard Button" className={"absolute top-5 right-5 p-6 hidden sm:block"}>
                    {isCopied ? <CopyCheck/> : <CopyIcon />}
                </button>
            </CopyToClipboard>

            <SyntaxHighlighter style={codeStyle}>
                {code}
            </SyntaxHighlighter>
        </div>
    );
}
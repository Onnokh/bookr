import React from 'react';
interface AppProps {
    input: string[];
    flags: {
        time?: string | undefined;
        date?: string | undefined;
        description?: string | undefined;
    } & Record<string, unknown>;
}
export declare const App: React.FC<AppProps>;
export {};
//# sourceMappingURL=App.d.ts.map
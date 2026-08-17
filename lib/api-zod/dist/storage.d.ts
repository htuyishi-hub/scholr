import * as zod from "zod";
export declare const RequestUploadUrlBody: zod.ZodObject<{
    name: zod.ZodString;
    size: zod.ZodNumber;
    contentType: zod.ZodString;
}, "strip", zod.ZodTypeAny, {
    name: string;
    size: number;
    contentType: string;
}, {
    name: string;
    size: number;
    contentType: string;
}>;
export declare const RequestUploadUrlResponse: zod.ZodObject<{
    uploadURL: zod.ZodString;
    objectPath: zod.ZodString;
    metadata: zod.ZodObject<{
        name: zod.ZodString;
        size: zod.ZodNumber;
        contentType: zod.ZodString;
    }, "strip", zod.ZodTypeAny, {
        name: string;
        size: number;
        contentType: string;
    }, {
        name: string;
        size: number;
        contentType: string;
    }>;
}, "strip", zod.ZodTypeAny, {
    uploadURL: string;
    objectPath: string;
    metadata: {
        name: string;
        size: number;
        contentType: string;
    };
}, {
    uploadURL: string;
    objectPath: string;
    metadata: {
        name: string;
        size: number;
        contentType: string;
    };
}>;
//# sourceMappingURL=storage.d.ts.map
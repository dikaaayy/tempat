import { NextApiRequest, NextApiResponse } from "next";
import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { prisma } from "../../../lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { createTransport } from "nodemailer";
import { URLSearchParams } from "url";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_SERVER_USER,
      async sendVerificationRequest(params) {
        const { identifier, url, provider, theme } = params;
        const oldurl = new URL(url);
        const host = process.env.NEXT_PUBLIC_API_URL!;
        const newURL = decodeURIComponent(String(oldurl)).replaceAll("http://localhost:3000", process.env.NEXT_PUBLIC_API_URL!);

        // NOTE: You are not required to use `nodemailer`, use whatever you want.
        const transport = createTransport(provider.server);
        const result = await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: `Hi, we recieved for your request! Please verify yourself to continue single sign on`,
          // text: text({ newURL, host }),
          html: html({ newURL }),
        });
        const failed = result.rejected.concat(result.pending).filter(Boolean);
        if (failed.length) {
          throw new Error(`Email(s) (${failed.join(", ")}) could not be sent`);
        }
      },
    }),
    // ...add more providers here
  ],
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXT_PUBLIC_SECRET,
};

function html(params: { newURL: any }) {
  const { newURL } = params;

  return `
<body style="background: white;">
<table width="100%" border="0" cellspacing="20" cellpadding="0"
  style="max-width: 600px; margin: auto; border-radius: 10px;">
  <tr>
    <td align="center">
      <svg width="201" height="200" viewBox="0 0 201 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M177.232 113.092C177.832 111.86 178.364 110.564 178.824 109.206C184.09 93.666 176.126 75.05 159.358 70.556C157.546 47.788 141.546 32.17 123.476 29.504C102.794 26.454 83.848 39.592 77.544 60.474C69.946 57.782 62.542 58.11 55.564 62.188C52.398 63.652 49.502 65.812 46.904 68.654C43.09 72.826 40.61 78.092 39.6 83.644C38.104 83.88 36.634 84.116 35.248 84.612C27.168 87.51 22.07 93.474 20.672 102.458C19.802 108.052 21.558 113.632 22.538 115.886C26.408 124.796 35.382 129.846 44.5 128.51C44.954 128.444 45.614 128.648 46.004 128.976C46.486 143.216 53.4 155.81 63.772 163.004C80.414 174.548 101.826 170.992 115.334 155.162C121.122 161.082 128.01 163.958 136.102 162.914C144.148 161.876 150.396 157.436 154.954 150.216C157.06 150.782 159.056 151.598 161.12 151.824C169.204 152.708 175.768 149.494 180.584 142.224C182.428 139.442 184.17 135.836 184.17 129.516C184.172 123.006 181.586 117.072 177.232 113.092Z" fill="#FDEAEA"/>
      <path d="M147.76 100.342C147.76 100.342 171.142 100.342 171.284 100.342C176.684 100.342 181.06 95.964 181.06 90.564C181.06 85.854 177.728 81.922 173.292 80.996C173.344 80.584 173.378 80.166 173.378 79.74C173.378 74.148 168.844 69.614 163.252 69.614C159.95 69.614 157.026 71.202 155.178 73.648C154.706 67.422 149.144 62.62 142.638 63.416C137.88 63.998 133.946 67.676 133.07 72.388C132.79 73.9 132.818 75.366 133.098 76.742C131.822 75.368 130.006 74.504 127.984 74.504C124.284 74.504 121.262 77.386 121.024 81.026C119.344 80.654 117.516 80.678 115.59 81.402C111.91 82.784 109.29 86.248 109.136 90.176C108.918 95.754 113.376 100.346 118.906 100.346C119.326 100.346 120.802 100.346 121.142 100.346H141.444" fill="#FDEAEA"/>
      <path d="M171.284 101.342H147.762C147.21 101.342 146.762 100.894 146.762 100.342C146.762 99.79 147.21 99.342 147.762 99.342H171.286C176.126 99.342 180.064 95.404 180.064 90.564C180.064 86.43 177.132 82.818 173.092 81.974C172.584 81.868 172.24 81.39 172.304 80.872C172.348 80.5 172.382 80.124 172.382 79.74C172.382 74.706 168.288 70.614 163.256 70.614C160.38 70.614 157.726 71.94 155.978 74.25C155.728 74.582 155.294 74.722 154.9 74.606C154.5 74.488 154.216 74.138 154.184 73.724C153.976 70.97 152.628 68.382 150.484 66.626C148.32 64.85 145.572 64.062 142.764 64.408C138.434 64.94 134.854 68.294 134.058 72.57C133.81 73.904 133.818 75.24 134.084 76.542C134.172 76.982 133.96 77.426 133.56 77.63C133.166 77.84 132.678 77.752 132.37 77.422C131.22 76.186 129.664 75.504 127.99 75.504C124.854 75.504 122.234 77.958 122.03 81.09C122.01 81.382 121.866 81.65 121.632 81.824C121.396 82 121.09 82.06 120.814 82C119.126 81.63 117.536 81.738 115.946 82.334C112.608 83.588 110.274 86.752 110.14 90.21C110.046 92.624 110.914 94.912 112.584 96.648C114.256 98.384 116.502 99.342 118.91 99.342H141.45C142.002 99.342 142.45 99.79 142.45 100.342C142.45 100.894 142.002 101.342 141.45 101.342H118.91C115.952 101.342 113.196 100.168 111.142 98.036C109.092 95.904 108.024 93.096 108.14 90.134C108.308 85.882 111.162 81.996 115.244 80.464C116.844 79.864 118.5 79.668 120.18 79.866C120.934 76.222 124.172 73.502 127.988 73.502C129.358 73.502 130.696 73.862 131.876 74.522C131.874 73.75 131.946 72.976 132.09 72.202C133.042 67.078 137.328 63.058 142.518 62.422C145.87 62.018 149.156 62.954 151.748 65.078C153.756 66.724 155.182 68.98 155.824 71.464C157.85 69.632 160.462 68.612 163.252 68.612C169.386 68.612 174.378 73.604 174.378 79.738C174.378 79.904 174.374 80.07 174.364 80.234C178.872 81.58 182.06 85.786 182.06 90.562C182.062 96.508 177.228 101.342 171.284 101.342Z" fill="#472B29"/>
      <path d="M142.094 78.804C138.478 78.566 135.364 81.064 135.142 84.382C135.114 84.794 135.132 85.2 135.192 85.594C134.494 84.806 133.462 84.272 132.276 84.194C130.106 84.052 128.232 85.484 127.96 87.434C127.566 87.326 127.154 87.254 126.728 87.226C123.564 87.018 120.84 89.204 120.644 92.108" fill="#FDEAEA"/>
      <path d="M120.646 92.606C120.634 92.606 120.624 92.606 120.612 92.604C120.336 92.586 120.128 92.348 120.148 92.072C120.36 88.898 123.286 86.494 126.762 86.726C127.032 86.742 127.304 86.778 127.58 86.832C128.128 84.896 130.088 83.516 132.31 83.696C133.16 83.75 133.956 84.016 134.636 84.46C134.638 84.422 134.64 84.388 134.644 84.35C134.882 80.762 138.194 78.026 142.128 78.306C142.404 78.324 142.612 78.562 142.592 78.838C142.576 79.102 142.356 79.304 142.094 79.304C142.084 79.304 142.072 79.304 142.06 79.302C138.732 79.122 135.844 81.38 135.638 84.418C135.614 84.79 135.63 85.16 135.684 85.52C135.718 85.738 135.604 85.956 135.402 86.05C135.198 86.14 134.962 86.092 134.814 85.928C134.18 85.21 133.24 84.76 132.24 84.694C130.388 84.594 128.69 85.808 128.454 87.504C128.432 87.646 128.352 87.774 128.234 87.854C128.116 87.934 127.964 87.954 127.828 87.918C127.446 87.814 127.064 87.75 126.694 87.724C123.798 87.528 121.318 89.516 121.142 92.14C121.126 92.404 120.908 92.606 120.646 92.606Z" fill="#472B29"/>
      <path d="M175.244 82.142C171.846 80.54 167.916 81.674 166.466 84.676C166.286 85.048 166.152 85.434 166.064 85.824" fill="#FDEAEA"/>
      <path d="M166.064 86.324C166.028 86.324 165.992 86.32 165.954 86.312C165.684 86.252 165.514 85.984 165.576 85.714C165.672 85.286 165.82 84.864 166.016 84.458C167.586 81.214 171.822 79.974 175.458 81.688C175.708 81.808 175.816 82.104 175.698 82.354C175.58 82.606 175.278 82.708 175.032 82.594C171.888 81.108 168.246 82.14 166.918 84.89C166.754 85.228 166.63 85.578 166.552 85.932C166.5 86.164 166.292 86.324 166.064 86.324Z" fill="#472B29"/>
      <path d="M36.562 97.164H16.502C15.95 97.164 15.502 96.716 15.502 96.164C15.502 95.612 15.95 95.164 16.502 95.164H36.562C37.114 95.164 37.562 95.612 37.562 96.164C37.562 96.716 37.114 97.164 36.562 97.164ZM42.324 97.164H39.434C38.882 97.164 38.434 96.716 38.434 96.164C38.434 95.612 38.882 95.164 39.434 95.164H42.324C42.876 95.164 43.324 95.612 43.324 96.164C43.324 96.716 42.876 97.164 42.324 97.164ZM50.432 97.164H45.34C44.788 97.164 44.34 96.716 44.34 96.164C44.34 95.612 44.788 95.164 45.34 95.164H50.432C50.984 95.164 51.432 95.612 51.432 96.164C51.432 96.716 50.986 97.164 50.432 97.164ZM50.432 100.894H31.2C30.648 100.894 30.2 100.446 30.2 99.894C30.2 99.342 30.648 98.894 31.2 98.894H50.432C50.984 98.894 51.432 99.342 51.432 99.894C51.432 100.446 50.986 100.894 50.432 100.894ZM27.738 100.894H26.578C26.026 100.894 25.578 100.446 25.578 99.894C25.578 99.342 26.026 98.894 26.578 98.894H27.738C28.29 98.894 28.738 99.342 28.738 99.894C28.738 100.446 28.29 100.894 27.738 100.894ZM22.984 100.894H20.072C19.52 100.894 19.072 100.446 19.072 99.894C19.072 99.342 19.52 98.894 20.072 98.894H22.984C23.536 98.894 23.984 99.342 23.984 99.894C23.984 100.446 23.536 100.894 22.984 100.894ZM41.256 93.434H31.2C30.648 93.434 30.2 92.986 30.2 92.434C30.2 91.882 30.648 91.434 31.2 91.434H41.254C41.806 91.434 42.254 91.882 42.254 92.434C42.254 92.986 41.808 93.434 41.256 93.434ZM41.256 89.704H38.742C38.19 89.704 37.742 89.256 37.742 88.704C37.742 88.152 38.19 87.704 38.742 87.704H41.256C41.808 87.704 42.256 88.152 42.256 88.704C42.256 89.256 41.808 89.704 41.256 89.704ZM34.718 104.624H31.2C30.648 104.624 30.2 104.176 30.2 103.624C30.2 103.072 30.648 102.624 31.2 102.624H34.718C35.27 102.624 35.718 103.072 35.718 103.624C35.718 104.176 35.27 104.624 34.718 104.624ZM142.918 44.61H122.858C122.306 44.61 121.858 44.162 121.858 43.61C121.858 43.058 122.306 42.61 122.858 42.61H142.918C143.47 42.61 143.918 43.058 143.918 43.61C143.918 44.162 143.47 44.61 142.918 44.61ZM148.68 44.61H145.788C145.236 44.61 144.788 44.162 144.788 43.61C144.788 43.058 145.236 42.61 145.788 42.61H148.68C149.232 42.61 149.68 43.058 149.68 43.61C149.68 44.162 149.234 44.61 148.68 44.61ZM156.788 44.61H151.696C151.144 44.61 150.696 44.162 150.696 43.61C150.696 43.058 151.144 42.61 151.696 42.61H156.788C157.34 42.61 157.788 43.058 157.788 43.61C157.788 44.162 157.342 44.61 156.788 44.61ZM152.738 37.152H133.506C132.954 37.152 132.506 36.704 132.506 36.152C132.506 35.6 132.954 35.152 133.506 35.152H152.738C153.29 35.152 153.738 35.6 153.738 36.152C153.738 36.704 153.29 37.152 152.738 37.152ZM130.042 37.152H128.882C128.33 37.152 127.882 36.704 127.882 36.152C127.882 35.6 128.33 35.152 128.882 35.152H130.042C130.594 35.152 131.042 35.6 131.042 36.152C131.042 36.704 130.596 37.152 130.042 37.152ZM125.288 37.152H122.376C121.824 37.152 121.376 36.704 121.376 36.152C121.376 35.6 121.824 35.152 122.376 35.152H125.288C125.84 35.152 126.288 35.6 126.288 36.152C126.288 36.704 125.842 37.152 125.288 37.152ZM147.61 40.88H137.556C137.004 40.88 136.556 40.432 136.556 39.88C136.556 39.328 137.004 38.88 137.556 38.88H147.61C148.162 38.88 148.61 39.328 148.61 39.88C148.61 40.432 148.164 40.88 147.61 40.88Z" fill="#611515"/>
      <path d="M147.61 37.152H145.096C144.544 37.152 144.096 36.704 144.096 36.152C144.096 35.6 144.544 35.152 145.096 35.152H147.61C148.162 35.152 148.61 35.6 148.61 36.152C148.61 36.704 148.164 37.152 147.61 37.152ZM134.646 40.88H131.128C130.576 40.88 130.128 40.432 130.128 39.88C130.128 39.328 130.576 38.88 131.128 38.88H134.646C135.198 38.88 135.646 39.328 135.646 39.88C135.646 40.432 135.198 40.88 134.646 40.88Z" fill="#611515"/>
      <path d="M137.596 144.892H73.776C67.68 144.892 62.692 139.904 62.692 133.808V69.986C62.692 63.89 67.68 58.902 73.776 58.902H137.598C143.694 58.902 148.682 63.89 148.682 69.986V133.808C148.68 139.904 143.692 144.892 137.596 144.892Z" fill="white"/>
      <path d="M137.596 146.292H73.774C66.892 146.292 61.29 140.69 61.29 133.808V69.988C61.29 63.106 66.892 57.504 73.774 57.504H137.596C144.478 57.504 150.08 63.106 150.08 69.988V133.808C150.082 140.69 144.48 146.292 137.596 146.292ZM73.774 60.304C68.434 60.304 64.09 64.648 64.09 69.988V133.808C64.09 139.148 68.434 143.492 73.774 143.492H137.596C142.936 143.492 147.28 139.148 147.28 133.808V69.988C147.28 64.648 142.936 60.304 137.596 60.304H73.774Z" fill="#472B29"/>
      <path d="M64.068 72.1801H147.302V135.408H64.068V72.1801Z" fill="#F7BFBF"/>
      <path d="M130.346 73.1801H122.758C122.206 73.1801 121.758 72.7321 121.758 72.1801C121.758 71.6281 122.206 71.1801 122.758 71.1801H130.346C130.898 71.1801 131.346 71.6281 131.346 72.1801C131.346 72.7321 130.898 73.1801 130.346 73.1801ZM118.964 73.1801H63.324C62.772 73.1801 62.324 72.7321 62.324 72.1801C62.324 71.6281 62.772 71.1801 63.324 71.1801H118.964C119.516 71.1801 119.964 71.6281 119.964 72.1801C119.964 72.7321 119.516 73.1801 118.964 73.1801ZM148.048 73.1801H136.668C136.116 73.1801 135.668 72.7321 135.668 72.1801C135.668 71.6281 136.116 71.1801 136.668 71.1801H148.048C148.6 71.1801 149.048 71.6281 149.048 72.1801C149.048 72.7321 148.6 73.1801 148.048 73.1801ZM148.048 136.406H78.498C77.946 136.406 77.498 135.958 77.498 135.406C77.498 134.854 77.946 134.406 78.498 134.406H148.048C148.6 134.406 149.048 134.854 149.048 135.406C149.048 135.958 148.6 136.406 148.048 136.406ZM74.704 136.406H63.324C62.772 136.406 62.324 135.958 62.324 135.406C62.324 134.854 62.772 134.406 63.324 134.406H74.704C75.256 134.406 75.704 134.854 75.704 135.406C75.704 135.958 75.258 136.406 74.704 136.406Z" fill="#472B29"/>
      <path d="M73.44 63.328C72.769 63.328 72.1255 63.5946 71.651 64.069C71.1765 64.5435 70.91 65.187 70.91 65.858C70.91 66.529 71.1765 67.1725 71.651 67.647C72.1255 68.1215 72.769 68.388 73.44 68.388C74.111 68.388 74.7545 68.1215 75.229 67.647C75.7034 67.1725 75.97 66.529 75.97 65.858C75.97 65.187 75.7034 64.5435 75.229 64.069C74.7545 63.5946 74.111 63.328 73.44 63.328Z" fill="#EE3E54"/>
      <path d="M73.438 68.9861C71.714 68.9861 70.312 67.5841 70.312 65.8601C70.312 64.1361 71.714 62.7321 73.438 62.7321C75.162 62.7321 76.566 64.1361 76.566 65.8601C76.566 67.5841 75.164 68.9861 73.438 68.9861ZM73.438 63.9281C72.376 63.9281 71.51 64.7941 71.51 65.8581C71.51 66.9201 72.376 67.7861 73.438 67.7861C74.502 67.7861 75.368 66.9201 75.368 65.8581C75.368 64.7941 74.504 63.9281 73.438 63.9281Z" fill="#472B29"/>
      <path d="M82.292 63.328C81.621 63.328 80.9775 63.5946 80.503 64.069C80.0285 64.5435 79.762 65.187 79.762 65.858C79.762 66.529 80.0285 67.1725 80.503 67.647C80.9775 68.1215 81.621 68.388 82.292 68.388C82.963 68.388 83.6065 68.1215 84.081 67.647C84.5554 67.1725 84.822 66.529 84.822 65.858C84.822 65.187 84.5554 64.5435 84.081 64.069C83.6065 63.5946 82.963 63.328 82.292 63.328Z" fill="#F1BC19"/>
      <path d="M82.292 68.9861C80.568 68.9861 79.164 67.5841 79.164 65.8601C79.164 64.1361 80.568 62.7321 82.292 62.7321C84.016 62.7321 85.418 64.1361 85.418 65.8601C85.418 67.5841 84.016 68.9861 82.292 68.9861ZM82.292 63.9281C81.228 63.9281 80.362 64.7941 80.362 65.8581C80.362 66.9201 81.228 67.7861 82.292 67.7861C83.354 67.7861 84.22 66.9201 84.22 65.8581C84.22 64.7941 83.354 63.9281 82.292 63.9281Z" fill="#472B29"/>
      <path d="M91.144 63.328C90.473 63.328 89.8295 63.5946 89.355 64.069C88.8805 64.5435 88.614 65.187 88.614 65.858C88.614 66.529 88.8805 67.1725 89.355 67.647C89.8295 68.1215 90.473 68.388 91.144 68.388C91.815 68.388 92.4585 68.1215 92.933 67.647C93.4074 67.1725 93.674 66.529 93.674 65.858C93.674 65.187 93.4074 64.5435 92.933 64.069C92.4585 63.5946 91.815 63.328 91.144 63.328Z" fill="#611515"/>
      <path d="M91.144 68.9861C89.42 68.9861 88.016 67.5841 88.016 65.8601C88.016 64.1361 89.42 62.7321 91.144 62.7321C92.868 62.7321 94.272 64.1361 94.272 65.8601C94.272 67.5841 92.868 68.9861 91.144 68.9861ZM91.144 63.9281C90.08 63.9281 89.214 64.7941 89.214 65.8581C89.214 66.9201 90.08 67.7861 91.144 67.7861C92.208 67.7861 93.074 66.9201 93.074 65.8581C93.074 64.7941 92.208 63.9281 91.144 63.9281Z" fill="#472B29"/>
      <path d="M83.82 150.192C87.586 150.192 90.854 150.192 90.9 150.192C95.12 150.192 98.542 146.844 98.542 142.714C98.542 139.11 95.938 136.104 92.472 135.394C92.512 135.078 92.54 134.76 92.54 134.434C92.54 130.156 88.996 126.688 84.626 126.688C82.046 126.688 79.76 127.902 78.316 129.774C77.946 125.012 73.6 121.338 68.516 121.948C64.798 122.394 61.722 125.206 61.038 128.81C60.818 129.966 60.842 131.088 61.06 132.14C60.064 131.09 58.644 130.428 57.064 130.428C54.172 130.428 51.81 132.632 51.624 135.416C50.31 135.132 48.882 135.15 47.378 135.702C44.502 136.758 42.454 139.408 42.334 142.414C42.164 146.68 45.648 150.192 49.97 150.192C50.298 150.192 51.452 150.192 51.718 150.192H67.586M70.864 150.192H71.584H70.864Z" fill="#FDEAEA"/>
      <path d="M90.9 151.192H83.82C83.268 151.192 82.82 150.744 82.82 150.192C82.82 149.64 83.268 149.192 83.82 149.192H90.9C94.562 149.192 97.54 146.286 97.54 142.714C97.54 139.666 95.324 137 92.268 136.376C91.758 136.27 91.412 135.79 91.476 135.272C91.51 134.996 91.534 134.72 91.534 134.434C91.534 130.714 88.432 127.688 84.62 127.688C82.436 127.688 80.424 128.67 79.102 130.386C78.852 130.714 78.418 130.848 78.026 130.734C77.63 130.614 77.346 130.266 77.316 129.854C77.156 127.814 76.184 125.966 74.574 124.646C72.918 123.286 70.8 122.682 68.63 122.94C65.338 123.334 62.618 125.824 62.014 128.998C61.826 129.984 61.834 130.974 62.034 131.938C62.126 132.376 61.914 132.82 61.518 133.028C61.124 133.232 60.638 133.152 60.33 132.83C59.472 131.926 58.31 131.43 57.056 131.43C54.718 131.43 52.766 133.212 52.614 135.484C52.594 135.776 52.45 136.042 52.218 136.216C51.986 136.394 51.688 136.456 51.404 136.394C50.134 136.12 48.926 136.198 47.716 136.644C45.192 137.57 43.426 139.906 43.326 142.456C43.256 144.204 43.89 145.87 45.116 147.144C46.386 148.464 48.108 149.192 49.964 149.192H67.58C68.132 149.192 68.58 149.64 68.58 150.192C68.58 150.744 68.132 151.192 67.58 151.192H49.964C47.592 151.192 45.302 150.222 43.674 148.528C42.068 146.858 41.236 144.672 41.326 142.376C41.462 139.026 43.752 135.968 47.026 134.764C48.25 134.316 49.51 134.146 50.788 134.276C51.478 131.484 54.046 129.428 57.058 129.428C58.058 129.428 59.018 129.648 59.886 130.064C59.904 129.584 59.958 129.104 60.05 128.622C60.814 124.602 64.246 121.448 68.392 120.952C71.134 120.614 73.764 121.39 75.844 123.096C77.34 124.322 78.4 125.914 78.938 127.7C80.518 126.404 82.508 125.686 84.622 125.686C89.538 125.686 93.536 129.61 93.536 134.432C93.536 134.5 93.534 134.568 93.532 134.638C97.062 135.746 99.54 139.014 99.54 142.712C99.54 147.39 95.664 151.192 90.9 151.192ZM71.584 151.192H70.866C70.314 151.192 69.866 150.744 69.866 150.192C69.866 149.64 70.314 149.192 70.866 149.192H71.584C72.136 149.192 72.584 149.64 72.584 150.192C72.584 150.744 72.136 151.192 71.584 151.192Z" fill="#472B29"/>
      <path d="M87.484 139.586C87.446 139.586 87.41 139.582 87.372 139.574C87.102 139.512 86.934 139.242 86.996 138.974C87.074 138.634 87.19 138.314 87.338 138.016C88.546 135.568 91.884 134.664 94.78 136.004C95.032 136.12 95.142 136.416 95.024 136.666C94.908 136.918 94.606 137.026 94.362 136.91C91.952 135.798 89.206 136.49 88.236 138.458C88.12 138.686 88.032 138.934 87.974 139.194C87.918 139.43 87.712 139.586 87.484 139.586ZM77.168 151.192H74.954C74.402 151.192 73.954 150.744 73.954 150.192C73.954 149.64 74.402 149.192 74.954 149.192H77.168C77.72 149.192 78.168 149.64 78.168 150.192C78.168 150.744 77.72 151.192 77.168 151.192Z" fill="#472B29"/>
      <path d="M88.56 80.858H122.322V90.494H88.56V80.858Z" fill="#FDFCEE"/>
      <path d="M122.322 91.146H88.56C88.2 91.146 87.91 90.854 87.91 90.496V80.86C87.91 80.5 88.202 80.21 88.56 80.21H122.322C122.682 80.21 122.972 80.502 122.972 80.86V90.496C122.972 90.854 122.68 91.146 122.322 91.146ZM89.21 89.844H121.67V81.508H89.21V89.844Z" fill="#472B29"/>
      <path d="M88.56 94.6121H122.322V104.248H88.56V94.6121Z" fill="#FDFCEE"/>
      <path d="M122.322 104.9H88.56C88.2 104.9 87.91 104.608 87.91 104.25V94.614C87.91 94.254 88.202 93.964 88.56 93.964H122.322C122.682 93.964 122.972 94.256 122.972 94.614V104.25C122.972 104.608 122.68 104.9 122.322 104.9ZM89.21 103.598H121.67V95.262H89.21V103.598Z" fill="#472B29"/>
      <path d="M98.35 97.852C98.396 97.872 98.45 97.908 98.51 97.96L98.52 97.982C98.566 98.038 98.606 98.102 98.64 98.174C98.674 98.246 98.69 98.312 98.69 98.372C98.69 98.474 98.644 98.566 98.552 98.648L97.434 99.398L98.552 100.14L98.522 100.116C98.642 100.178 98.702 100.266 98.702 100.384C98.702 100.434 98.682 100.494 98.646 100.56C98.61 100.626 98.568 100.682 98.522 100.728L98.512 100.774C98.452 100.824 98.398 100.858 98.352 100.872C98.306 100.886 98.252 100.896 98.192 100.896C98.066 100.896 97.972 100.862 97.912 100.796L97.254 100.368V101.172C97.254 101.228 97.234 101.28 97.194 101.328C97.154 101.376 97.104 101.418 97.044 101.452C96.984 101.484 96.918 101.51 96.844 101.528C96.77 101.546 96.7 101.556 96.634 101.556H96.594C96.434 101.556 96.33 101.526 96.28 101.464C96.23 101.402 96.198 101.328 96.184 101.242V100.408L95.546 100.828C95.452 100.898 95.356 100.936 95.256 100.936C95.204 100.936 95.146 100.924 95.082 100.902C95.018 100.878 94.968 100.84 94.928 100.784L94.918 100.754C94.878 100.708 94.842 100.646 94.814 100.57C94.784 100.494 94.768 100.428 94.768 100.372C94.768 100.266 94.81 100.178 94.898 100.112L95.996 99.386L94.898 98.652C94.812 98.582 94.768 98.498 94.768 98.4C94.768 98.272 94.828 98.15 94.948 98.034L94.978 98.004C95.024 97.962 95.07 97.934 95.114 97.92C95.156 97.904 95.206 97.896 95.258 97.896C95.304 97.896 95.354 97.902 95.402 97.916C95.452 97.928 95.5 97.952 95.546 97.988L96.206 98.424V97.684C96.206 97.572 96.274 97.482 96.41 97.416C96.546 97.35 96.688 97.318 96.836 97.318H96.866C97.02 97.318 97.12 97.346 97.17 97.402C97.22 97.458 97.252 97.528 97.266 97.616L97.256 98.358L97.914 97.922L97.894 97.936C97.986 97.866 98.086 97.828 98.194 97.828C98.25 97.822 98.304 97.832 98.35 97.852ZM104.154 97.852C104.2 97.872 104.254 97.908 104.314 97.96L104.324 97.982C104.37 98.038 104.41 98.102 104.444 98.174C104.478 98.246 104.494 98.312 104.494 98.372C104.494 98.474 104.448 98.566 104.356 98.648L103.238 99.398L104.356 100.14L104.326 100.116C104.446 100.178 104.506 100.266 104.506 100.384C104.506 100.434 104.486 100.494 104.45 100.56C104.414 100.626 104.372 100.682 104.326 100.728L104.316 100.774C104.256 100.824 104.202 100.858 104.156 100.872C104.11 100.886 104.056 100.896 103.996 100.896C103.87 100.896 103.776 100.862 103.716 100.796L103.058 100.368V101.172C103.058 101.228 103.038 101.28 102.998 101.328C102.958 101.376 102.908 101.418 102.848 101.452C102.788 101.484 102.722 101.51 102.648 101.528C102.574 101.546 102.504 101.556 102.438 101.556H102.398C102.238 101.556 102.134 101.526 102.084 101.464C102.034 101.402 102.002 101.328 101.988 101.242V100.408L101.35 100.828C101.256 100.898 101.16 100.936 101.06 100.936C101.008 100.936 100.95 100.924 100.886 100.902C100.822 100.878 100.772 100.84 100.732 100.784L100.722 100.754C100.682 100.708 100.646 100.646 100.618 100.57C100.588 100.494 100.572 100.428 100.572 100.372C100.572 100.266 100.614 100.178 100.702 100.112L101.8 99.386L100.7 98.648C100.614 98.578 100.57 98.494 100.57 98.396C100.57 98.268 100.63 98.146 100.75 98.03L100.78 98C100.826 97.958 100.872 97.93 100.916 97.916C100.958 97.9 101.008 97.892 101.06 97.892C101.106 97.892 101.156 97.898 101.204 97.912C101.254 97.924 101.302 97.948 101.348 97.984L102.008 98.42V97.68C102.008 97.568 102.076 97.478 102.212 97.412C102.348 97.346 102.49 97.314 102.638 97.314H102.668C102.822 97.314 102.922 97.342 102.972 97.398C103.022 97.454 103.054 97.524 103.068 97.612L103.058 98.354L103.716 97.918L103.696 97.932C103.788 97.862 103.888 97.824 103.996 97.824C104.054 97.822 104.108 97.832 104.154 97.852ZM109.96 97.852C110.006 97.872 110.06 97.908 110.12 97.96L110.13 97.982C110.176 98.038 110.216 98.102 110.25 98.174C110.284 98.246 110.3 98.312 110.3 98.372C110.3 98.474 110.254 98.566 110.162 98.648L109.044 99.398L110.162 100.14L110.132 100.116C110.252 100.178 110.312 100.266 110.312 100.384C110.312 100.434 110.292 100.494 110.256 100.56C110.22 100.626 110.178 100.682 110.132 100.728L110.122 100.774C110.062 100.824 110.008 100.858 109.962 100.872C109.916 100.886 109.862 100.896 109.802 100.896C109.676 100.896 109.582 100.862 109.522 100.796L108.864 100.368V101.172C108.864 101.228 108.844 101.28 108.804 101.328C108.764 101.376 108.714 101.418 108.654 101.452C108.594 101.484 108.528 101.51 108.454 101.528C108.38 101.546 108.31 101.556 108.244 101.556H108.204C108.044 101.556 107.94 101.526 107.89 101.464C107.84 101.402 107.808 101.328 107.794 101.242V100.408L107.156 100.828C107.062 100.898 106.966 100.936 106.866 100.936C106.814 100.936 106.756 100.924 106.692 100.902C106.628 100.878 106.578 100.84 106.538 100.784L106.528 100.754C106.488 100.708 106.452 100.646 106.424 100.57C106.394 100.494 106.378 100.428 106.378 100.372C106.378 100.266 106.42 100.178 106.508 100.112L107.606 99.386L106.508 98.652C106.422 98.582 106.378 98.498 106.378 98.4C106.378 98.272 106.438 98.15 106.558 98.034L106.588 98.004C106.634 97.962 106.68 97.934 106.724 97.92C106.766 97.904 106.816 97.896 106.868 97.896C106.914 97.896 106.964 97.902 107.012 97.916C107.062 97.928 107.11 97.952 107.156 97.988L107.816 98.424V97.684C107.816 97.572 107.884 97.482 108.02 97.416C108.156 97.35 108.298 97.318 108.446 97.318H108.476C108.63 97.318 108.73 97.346 108.78 97.402C108.83 97.458 108.862 97.528 108.876 97.616L108.866 98.358L109.524 97.922L109.504 97.936C109.596 97.866 109.696 97.828 109.804 97.828C109.86 97.822 109.914 97.832 109.96 97.852ZM115.764 97.852C115.81 97.872 115.864 97.908 115.924 97.96L115.934 97.982C115.98 98.038 116.02 98.102 116.054 98.174C116.088 98.246 116.104 98.312 116.104 98.372C116.104 98.474 116.058 98.566 115.966 98.648L114.848 99.398L115.966 100.14L115.936 100.116C116.056 100.178 116.116 100.266 116.116 100.384C116.116 100.434 116.096 100.494 116.06 100.56C116.024 100.626 115.982 100.682 115.936 100.728L115.926 100.774C115.866 100.824 115.812 100.858 115.766 100.872C115.72 100.886 115.666 100.896 115.606 100.896C115.48 100.896 115.386 100.862 115.326 100.796L114.668 100.368V101.172C114.668 101.228 114.648 101.28 114.608 101.328C114.568 101.376 114.518 101.418 114.458 101.452C114.398 101.484 114.332 101.51 114.258 101.528C114.184 101.546 114.114 101.556 114.048 101.556H114.008C113.848 101.556 113.744 101.526 113.694 101.464C113.644 101.402 113.612 101.328 113.598 101.242V100.408L112.96 100.828C112.866 100.898 112.77 100.936 112.67 100.936C112.618 100.936 112.56 100.924 112.496 100.902C112.432 100.878 112.382 100.84 112.342 100.784L112.332 100.754C112.292 100.708 112.256 100.646 112.228 100.57C112.198 100.494 112.182 100.428 112.182 100.372C112.182 100.266 112.224 100.178 112.312 100.112L113.41 99.386L112.312 98.652C112.226 98.582 112.182 98.498 112.182 98.4C112.182 98.272 112.242 98.15 112.362 98.034L112.392 98.004C112.438 97.962 112.484 97.934 112.528 97.92C112.57 97.904 112.62 97.896 112.672 97.896C112.718 97.896 112.768 97.902 112.816 97.916C112.866 97.928 112.914 97.952 112.96 97.988L113.62 98.424V97.684C113.62 97.572 113.688 97.482 113.824 97.416C113.96 97.35 114.102 97.318 114.25 97.318H114.28C114.434 97.318 114.534 97.346 114.584 97.402C114.634 97.458 114.666 97.528 114.68 97.616L114.67 98.358L115.328 97.922L115.308 97.936C115.4 97.866 115.5 97.828 115.608 97.828C115.664 97.822 115.718 97.832 115.764 97.852Z" fill="#472B29"/>
      <path d="M118.26 119.774H92.62C90.386 119.774 88.56 117.946 88.56 115.714V114.502C88.56 112.268 90.388 110.442 92.62 110.442H118.26C120.494 110.442 122.32 112.27 122.32 114.502V115.714C122.322 117.948 120.494 119.774 118.26 119.774Z" fill="#611515"/>
      <path d="M118.262 120.374H92.62C90.05 120.374 87.96 118.284 87.96 115.714V114.504C87.96 111.934 90.05 109.844 92.62 109.844H118.26C120.83 109.844 122.92 111.934 122.92 114.504V115.714C122.922 118.284 120.832 120.374 118.262 120.374ZM92.62 111.042C90.712 111.042 89.16 112.594 89.16 114.502V115.712C89.16 117.62 90.712 119.172 92.62 119.172H118.26C120.168 119.172 121.72 117.62 121.72 115.712V114.502C121.72 112.594 120.168 111.042 118.26 111.042H92.62Z" fill="#472B29"/>
      <path d="M157.924 123.846V112.968C157.924 107.006 152.206 102.28 146.352 102.28C140.486 102.28 134.346 107.112 134.346 113.076V123.846H138.506V113.212C138.506 109.674 142.572 106.816 145.95 106.816C149.32 106.816 153.07 109.616 153.07 113.148V123.846H157.924Z" fill="#611515"/>
      <path d="M158.676 124.596H152.32V113.146C152.32 110.002 148.896 107.564 145.95 107.564C142.936 107.564 139.256 110.17 139.256 113.21V124.594H133.596V113.074C133.596 106.464 140.33 101.528 146.35 101.528C152.914 101.528 158.674 106.872 158.674 112.966V124.596H158.676ZM153.82 123.096H157.176V112.968C157.176 107.676 152.118 103.03 146.352 103.03C141.146 103.03 135.098 107.418 135.098 113.076V123.096H137.758V113.212C137.758 109.186 142.162 106.066 145.952 106.066C149.666 106.066 153.822 109.096 153.822 113.148V123.096H153.82Z" fill="#472B29"/>
      <path d="M157.926 124.846C157.374 124.846 156.926 124.398 156.926 123.846V112.968C156.926 107.808 151.984 103.28 146.352 103.28C141.264 103.28 135.348 107.56 135.348 113.076V123.846C135.348 124.398 134.9 124.846 134.348 124.846C133.796 124.846 133.348 124.398 133.348 123.846V113.076C133.348 106.324 140.214 101.28 146.352 101.28C153.052 101.28 158.926 106.74 158.926 112.968V123.846C158.926 124.4 158.478 124.846 157.926 124.846Z" fill="#472B29"/>
      <path d="M150.006 149.504H141.57C133.21 149.504 126.372 142.664 126.372 134.306V124.15C126.372 122.076 128.068 120.38 130.142 120.38H161.436C163.51 120.38 165.206 122.076 165.206 124.15V134.306C165.206 142.664 158.366 149.504 150.006 149.504Z" fill="#611515"/>
      <path d="M150.008 150.504H141.57C132.638 150.504 125.37 143.236 125.37 134.304V124.146C125.37 121.516 127.51 119.376 130.142 119.376H161.434C164.064 119.376 166.206 121.516 166.206 124.148V134.304C166.206 143.238 158.938 150.504 150.008 150.504ZM130.142 121.378C128.614 121.378 127.37 122.62 127.37 124.148V134.306C127.37 142.136 133.74 148.506 141.57 148.506H150.008C157.838 148.506 164.208 142.136 164.208 134.306V124.15C164.208 122.622 162.964 121.378 161.436 121.378H130.142Z" fill="#472B29"/>
      <path d="M127.064 125.58H164.512V131.822H127.064V125.58Z" fill="#F1BC19"/>
      <path d="M165.206 132.472H126.37C126.01 132.472 125.72 132.18 125.72 131.822C125.72 131.464 126.012 131.172 126.37 131.172H165.206C165.566 131.172 165.856 131.464 165.856 131.822C165.856 132.18 165.566 132.472 165.206 132.472ZM153.07 126.23H126.37C126.01 126.23 125.72 125.938 125.72 125.58C125.72 125.222 126.012 124.93 126.37 124.93H153.07C153.43 124.93 153.72 125.222 153.72 125.58C153.72 125.938 153.43 126.23 153.07 126.23ZM160.698 126.23H155.842C155.482 126.23 155.192 125.938 155.192 125.58C155.192 125.222 155.484 124.93 155.842 124.93H160.698C161.058 124.93 161.348 125.222 161.348 125.58C161.348 125.938 161.058 126.23 160.698 126.23ZM164.858 126.23H162.778C162.418 126.23 162.128 125.938 162.128 125.58C162.128 125.222 162.42 124.93 162.778 124.93H164.858C165.218 124.93 165.508 125.222 165.508 125.58C165.508 125.938 165.218 126.23 164.858 126.23Z" fill="#472B29"/>
      <path d="M126.37 130.94C126.32 130.94 126.27 130.924 126.226 130.896C126.114 130.816 126.088 130.66 126.166 130.546L129.77 125.412C129.85 125.298 130.002 125.276 130.12 125.352C130.232 125.432 130.258 125.588 130.18 125.702L126.576 130.836C126.526 130.904 126.448 130.94 126.37 130.94ZM131.746 131.782C131.698 131.782 131.646 131.766 131.604 131.738C131.49 131.658 131.464 131.502 131.542 131.388L135.702 125.456C135.78 125.344 135.936 125.318 136.05 125.396C136.164 125.476 136.19 125.632 136.112 125.744L131.952 131.676C131.902 131.744 131.824 131.782 131.746 131.782ZM137.062 131.782C137.012 131.782 136.962 131.766 136.918 131.738C136.806 131.658 136.78 131.502 136.858 131.388L141.02 125.456C141.1 125.342 141.254 125.32 141.37 125.396C141.482 125.476 141.508 125.632 141.43 125.746L137.268 131.678C137.218 131.744 137.14 131.782 137.062 131.782ZM142.378 131.782C142.328 131.782 142.278 131.766 142.234 131.738C142.122 131.658 142.096 131.502 142.174 131.388L146.336 125.456C146.416 125.342 146.57 125.32 146.686 125.396C146.798 125.476 146.824 125.632 146.746 125.746L142.584 131.678C142.534 131.744 142.456 131.782 142.378 131.782ZM147.694 131.782C147.644 131.782 147.594 131.766 147.55 131.738C147.438 131.658 147.412 131.502 147.49 131.388L151.652 125.456C151.73 125.342 151.886 125.32 152.002 125.396C152.114 125.476 152.14 125.632 152.062 125.746L147.9 131.676C147.85 131.744 147.772 131.782 147.694 131.782ZM153.014 131.782C152.966 131.782 152.914 131.766 152.872 131.738C152.758 131.658 152.732 131.502 152.81 131.388L156.97 125.456C157.048 125.344 157.204 125.318 157.318 125.396C157.432 125.476 157.458 125.632 157.38 125.744L153.22 131.676C153.17 131.744 153.092 131.782 153.014 131.782ZM158.33 131.782C158.282 131.782 158.23 131.766 158.188 131.738C158.074 131.658 158.048 131.502 158.126 131.388L162.286 125.456C162.364 125.344 162.52 125.318 162.634 125.396C162.748 125.476 162.774 125.632 162.696 125.744L158.536 131.676C158.486 131.744 158.408 131.782 158.33 131.782Z" fill="#472B29"/>
      <path d="M147.956 144.304L146.756 140.3C146.672 140.072 146.526 139.878 146.732 139.748C147.354 139.356 147.718 138.594 147.506 137.764C147.352 137.162 146.862 136.668 146.262 136.51C145.064 136.196 143.988 137.092 143.988 138.24C143.988 138.872 144.316 139.424 144.81 139.74C145.022 139.876 144.95 140.034 144.864 140.272L143.6 144.306H147.956V144.304Z" fill="#F7BFBF"/>
      <path d="M147.956 144.854H143.598C143.422 144.854 143.258 144.77 143.154 144.63C143.05 144.488 143.02 144.306 143.072 144.14L144.338 140.106C144.338 140.106 144.342 140.098 144.346 140.084C143.774 139.642 143.436 138.964 143.436 138.236C143.436 137.504 143.77 136.826 144.35 136.378C144.93 135.928 145.676 135.782 146.4 135.974C147.192 136.182 147.834 136.83 148.038 137.624C148.27 138.536 147.956 139.478 147.246 140.05L147.27 140.108L148.48 144.144C148.528 144.31 148.498 144.492 148.394 144.63C148.294 144.772 148.13 144.854 147.956 144.854ZM144.348 143.752H147.218L146.23 140.458C145.984 139.89 146.066 139.514 146.442 139.28C146.904 138.988 147.114 138.446 146.974 137.9C146.87 137.492 146.526 137.146 146.12 137.038C145.728 136.938 145.332 137.01 145.022 137.25C144.714 137.486 144.538 137.848 144.538 138.236C144.538 138.658 144.75 139.046 145.108 139.276C145.678 139.644 145.472 140.208 145.396 140.42L144.348 143.752ZM147.03 140.21C147.03 140.21 147.028 140.212 147.026 140.212C147.028 140.212 147.03 140.21 147.03 140.21ZM128.9 131.936C128.85 131.936 128.8 131.92 128.756 131.892C128.644 131.812 128.618 131.656 128.696 131.542L132.858 125.612C132.936 125.498 133.092 125.476 133.208 125.552C133.32 125.632 133.346 125.788 133.268 125.902L129.106 131.832C129.056 131.9 128.978 131.936 128.9 131.936ZM134.346 131.936C134.296 131.936 134.246 131.92 134.202 131.892C134.09 131.812 134.064 131.656 134.142 131.542L138.302 125.612C138.382 125.498 138.536 125.476 138.652 125.552C138.764 125.632 138.79 125.788 138.712 125.902L134.552 131.832C134.504 131.9 134.426 131.936 134.346 131.936ZM139.656 131.782C139.608 131.782 139.556 131.766 139.514 131.738C139.4 131.658 139.374 131.502 139.452 131.388L143.612 125.456C143.69 125.344 143.846 125.318 143.96 125.396C144.074 125.476 144.1 125.632 144.022 125.744L139.862 131.676C139.812 131.744 139.734 131.782 139.656 131.782ZM144.838 131.936C144.788 131.936 144.738 131.92 144.694 131.892C144.582 131.812 144.556 131.656 144.634 131.542L148.794 125.612C148.874 125.498 149.026 125.476 149.144 125.552C149.256 125.632 149.282 125.788 149.204 125.902L145.044 131.832C144.994 131.9 144.916 131.936 144.838 131.936ZM150.38 131.936C150.33 131.936 150.28 131.92 150.236 131.892C150.124 131.812 150.098 131.656 150.176 131.542L154.336 125.612C154.416 125.498 154.568 125.476 154.686 125.552C154.798 125.632 154.824 125.788 154.746 125.902L150.586 131.832C150.536 131.9 150.458 131.936 150.38 131.936ZM155.498 132.072C155.45 132.072 155.398 132.056 155.356 132.028C155.242 131.948 155.216 131.792 155.294 131.678L159.454 125.746C159.532 125.632 159.69 125.608 159.802 125.686C159.916 125.766 159.942 125.922 159.864 126.034L155.704 131.966C155.654 132.034 155.576 132.072 155.498 132.072ZM160.854 132.072C160.804 132.072 160.754 132.056 160.71 132.028C160.598 131.948 160.572 131.792 160.65 131.678L164.812 125.746C164.892 125.63 165.046 125.612 165.162 125.686C165.274 125.766 165.3 125.922 165.222 126.036L161.06 131.968C161.012 132.034 160.932 132.072 160.854 132.072Z" fill="#472B29"/>
      </svg>
    </td>
  </tr>
  <tr>
    <td align="center"
    style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif;font-weight: 600;">
    Selamat datang di Nomato
    </td>
  </tr>
  <tr>
    <td align="center"
      style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif;">
      Terima kasih sudah melakukan registrasi. Silahkan klik tombol dibawah untuk login:
    </td>
  </tr>
  <tr>
    <td align="center" style="padding: 20px 0;">
      <table border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center" style="border-radius: 5px;" bgcolor="#952525">
            <a href="${newURL}"
              target="_blank"
              style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: white; text-decoration: none; border-radius: 100%; padding: 10px 20px; display: inline-block; font-weight: bold;">Masuk
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
`;
}

// function text({ newURL, host }: { newURL: any; host: any }) {
//   return `Sign in to ${host}\n${newURL}\n\n`;
// }

export default NextAuth(authOptions);

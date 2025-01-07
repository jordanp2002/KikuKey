"use client";

import { JSX, Fragment } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackButton } from "@/components/ui/back-button";

const VOWELS = ["a", "i", "u", "e", "o"];
const CONSONANTS = ["", "k", "s", "t", "n", "h", "m", "y", "r", "w", "n"];

export default function WritingChartsPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-6 max-w-7xl mx-auto p-4">
      <BackButton />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Japanese Writing Charts</h1>
        <p className="text-muted-foreground">Reference charts for Hiragana and Katakana writing systems.</p>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <h2 className="text-xl font-semibold mb-3 text-[#F87171]">Understanding Japanese Writing</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2 p-4 rounded-xl border-2 bg-background">
            <h3 className="text-lg font-medium">Basic Structure</h3>
            <p className="text-sm leading-relaxed">
              Japanese uses two phonetic alphabets (Hiragana and Katakana) and Kanji (Chinese characters). 
              Both Hiragana and Katakana represent the same sounds but serve different purposes:
            </p>
            <ul className="text-sm list-disc pl-4 space-y-1">
              <li><strong className="text-[#F87171]">Hiragana</strong>: Used for native Japanese words, grammar particles, and verb/adjective conjugations</li>
              <li><strong className="text-[#F87171]">Katakana</strong>: Used primarily for foreign loanwords and technical/scientific terms</li>
            </ul>
          </div>
          <div className="space-y-2 p-4 rounded-xl border-2 bg-background">
            <h3 className="text-lg font-medium">Sound Modifications</h3>
            <p className="text-sm leading-relaxed">
              Both writing systems use diacritical marks to modify consonant sounds:
            </p>
            <ul className="text-sm list-disc pl-4 space-y-1">
              <li><strong className="text-[#F87171]">Dakuten (゛)</strong>: Two dots added to the top-right of a character that change unvoiced consonants to voiced ones (k→g, s→z, t→d, h→b)</li>
              <li><strong className="text-[#F87171]">Handakuten (゜)</strong>: A small circle added to the top-right of は-row characters to create "p" sounds (h→p)</li>
            </ul>
          </div>
        </div>
      </div>

      <Tabs defaultValue="hiragana" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="hiragana" className="data-[state=active]:bg-[#F87171] data-[state=active]:text-white">Hiragana</TabsTrigger>
          <TabsTrigger value="katakana" className="data-[state=active]:bg-[#F87171] data-[state=active]:text-white">Katakana</TabsTrigger>
        </TabsList>
        <TabsContent value="hiragana" className="mt-6">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#F87171]">Hiragana Chart</h2>
            <div className="relative p-4 rounded-xl border-2">
              <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-4 mb-4 text-center">
                <div className="text-muted-foreground font-medium"></div>
                {VOWELS.map((vowel) => (
                  <div key={vowel} className="text-[#F87171] font-medium">{vowel}</div>
                ))}
              </div>
              <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-4">
                {[
                  ["", "あ a", "い i", "う u", "え e", "お o"],
                  ["k", "か ka", "き ki", "く ku", "け ke", "こ ko"],
                  ["s", "さ sa", "し shi", "す su", "せ se", "そ so"],
                  ["t", "た ta", "ち chi", "つ tsu", "て te", "と to"],
                  ["n", "な na", "に ni", "ぬ nu", "ね ne", "の no"],
                  ["h", "は ha", "ひ hi", "ふ fu", "へ he", "ほ ho"],
                  ["m", "ま ma", "み mi", "む mu", "め me", "も mo"],
                  ["y", "や ya", "", "ゆ yu", "", "よ yo"],
                  ["r", "ら ra", "り ri", "る ru", "れ re", "ろ ro"],
                  ["w", "わ wa", "", "", "", "を wo"],
                  ["n", "ん n", "", "", "", ""],
                ].map((row, i) => (
                  <Fragment key={`row-${i}`}>
                    <div className="text-[#F87171] font-medium text-center">
                      {row[0]}
                    </div>
                    {row.slice(1).map((char, j) => (
                      <div
                        key={`${i}-${j}`}
                        className={`p-3 rounded-lg border-2 hover:border-[#F87171] transition-colors duration-300 ${
                          char ? 'bg-background shadow-sm' : 'border-transparent'
                        } text-center`}
                      >
                        {char}
                      </div>
                    ))}
                  </Fragment>
                ))}
              </div>
            </div>

            <h3 className="text-xl font-semibold mt-8 text-[#F87171]">Dakuten and Handakuten</h3>
            <div className="relative p-4 rounded-xl border-2">
              <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-4 mb-4 text-center">
                <div className="text-muted-foreground font-medium"></div>
                {VOWELS.map((vowel) => (
                  <div key={vowel} className="text-[#F87171] font-medium">{vowel}</div>
                ))}
              </div>
              <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-4">
                {[
                  ["g", "が ga", "ぎ gi", "ぐ gu", "げ ge", "ご go"],
                  ["z", "ざ za", "じ ji", "ず zu", "ぜ ze", "ぞ zo"],
                  ["d", "だ da", "ぢ ji", "づ zu", "で de", "ど do"],
                  ["b", "ば ba", "び bi", "ぶ bu", "べ be", "ぼ bo"],
                  ["p", "ぱ pa", "ぴ pi", "ぷ pu", "ぺ pe", "ぽ po"],
                ].map((row, i) => (
                  <Fragment key={`dakuten-row-${i}`}>
                    <div className="text-[#F87171] font-medium text-center">
                      {row[0]}
                    </div>
                    {row.slice(1).map((char, j) => (
                      <div
                        key={`dakuten-${i}-${j}`}
                        className="p-3 rounded-lg border-2 hover:border-[#F87171] transition-colors duration-300 bg-background shadow-sm text-center"
                      >
                        {char}
                      </div>
                    ))}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="katakana" className="mt-6">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#F87171]">Katakana Chart</h2>
            <div className="relative p-4 rounded-xl border-2">
              <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-4 mb-4 text-center">
                <div className="text-muted-foreground font-medium"></div>
                {VOWELS.map((vowel) => (
                  <div key={vowel} className="text-[#F87171] font-medium">{vowel}</div>
                ))}
              </div>
              <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-4">
                {[
                  ["", "ア a", "イ i", "ウ u", "エ e", "オ o"],
                  ["k", "カ ka", "キ ki", "ク ku", "ケ ke", "コ ko"],
                  ["s", "サ sa", "シ shi", "ス su", "セ se", "ソ so"],
                  ["t", "タ ta", "チ chi", "ツ tsu", "テ te", "ト to"],
                  ["n", "ナ na", "ニ ni", "ヌ nu", "ネ ne", "ノ no"],
                  ["h", "ハ ha", "ヒ hi", "フ fu", "ヘ he", "ホ ho"],
                  ["m", "マ ma", "ミ mi", "ム mu", "メ me", "モ mo"],
                  ["y", "ヤ ya", "", "ユ yu", "", "ヨ yo"],
                  ["r", "ラ ra", "リ ri", "ル ru", "レ re", "ロ ro"],
                  ["w", "ワ wa", "", "", "", "ヲ wo"],
                  ["n", "ン n", "", "", "", ""],
                ].map((row, i) => (
                  <Fragment key={`katakana-row-${i}`}>
                    <div className="text-[#F87171] font-medium text-center">
                      {row[0]}
                    </div>
                    {row.slice(1).map((char, j) => (
                      <div
                        key={`katakana-${i}-${j}`}
                        className={`p-3 rounded-lg border-2 hover:border-[#F87171] transition-colors duration-300 ${
                          char ? 'bg-background shadow-sm' : 'border-transparent'
                        } text-center`}
                      >
                        {char}
                      </div>
                    ))}
                  </Fragment>
                ))}
              </div>
            </div>

            <h3 className="text-xl font-semibold mt-8 text-[#F87171]">Dakuten and Handakuten</h3>
            <div className="relative p-4 rounded-xl border-2">
              <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-4 mb-4 text-center">
                <div className="text-muted-foreground font-medium"></div>
                {VOWELS.map((vowel) => (
                  <div key={vowel} className="text-[#F87171] font-medium">{vowel}</div>
                ))}
              </div>
              <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-4">
                {[
                  ["g", "ガ ga", "ギ gi", "グ gu", "ゲ ge", "ゴ go"],
                  ["z", "ザ za", "ジ ji", "ズ zu", "ゼ ze", "ゾ zo"],
                  ["d", "ダ da", "ヂ ji", "ヅ zu", "デ de", "ド do"],
                  ["b", "バ ba", "ビ bi", "ブ bu", "ベ be", "ボ bo"],
                  ["p", "パ pa", "ピ pi", "プ pu", "ペ pe", "ポ po"],
                ].map((row, i) => (
                  <Fragment key={`katakana-dakuten-row-${i}`}>
                    <div className="text-[#F87171] font-medium text-center">
                      {row[0]}
                    </div>
                    {row.slice(1).map((char, j) => (
                      <div
                        key={`katakana-dakuten-${i}-${j}`}
                        className="p-3 rounded-lg border-2 hover:border-[#F87171] transition-colors duration-300 bg-background shadow-sm text-center"
                      >
                        {char}
                      </div>
                    ))}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
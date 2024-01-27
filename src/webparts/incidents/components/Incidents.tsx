import * as React from 'react';
import styles from './Incidents.module.scss';
import type { IIncidentsProps } from './IIncidentsProps';
import { escape } from '@microsoft/sp-lodash-subset';

export default class Incidents extends React.Component<IIncidentsProps, {}> {
  public render(): React.ReactElement<IIncidentsProps> {
    const {
      hasTeamsContext,
      userDisplayName,
      incidents
    } = this.props;

    return (
      <section className={`${styles.incidents} ${hasTeamsContext ? styles.teams : ''}`}>
        <div>
          <h2>Hey, {escape(userDisplayName)}!</h2>
          <h3>Welcome to SPFx ServiceNow Demo!</h3>
          <p>
            This demo shows how you can consume ServiceNow Table API directly from SPO 
            use an Access Token from Microsoft Entra. 
          </p>
          <h4>Here is the list of incidents from ServiceNow that the current user has accessi:</h4>
          <ul>{incidents.map((h, i) => <li key={i}>
            {`${h.number} - ${h.short_description}`}
            </li>)}</ul>
        </div>
      </section>
    );
  }
}
